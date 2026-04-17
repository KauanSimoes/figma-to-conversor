let currentTab = 'mta';

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('output-label').innerText = tab === 'mta' ? "Resultado MTA:" : "Resultado C++:";
}

function processManualJSON() {
    const jsonInput = document.getElementById('figma-json').value;
    const output = document.getElementById('code-output');

    try {
        const data = JSON.parse(jsonInput);
        
        // Verifica se é um nó único ou o arquivo todo
        const node = data.children ? data : (data.node ? data.node : data);
        
        if (!node.absoluteBoundingBox) {
            throw new Error("O JSON colado não tem coordenadas. Certifique-se de copiar um FRAME.");
        }

        output.innerText = currentTab === 'mta' ? generateMTA(node) : generateCPP(node);

    } catch (err) {
        output.innerText = "❌ Erro ao ler o JSON: " + err.message + "\n\nCertifique-se de clicar com o botão direito no Frame no Figma e escolher 'Copy/Paste' -> 'Copy as JSON'.";
    }
}

function generateMTA(node) {
    const { x: fX, y: fY, width: fW, height: fH } = node.absoluteBoundingBox;
    let lua = `-- UI Detroit | Base: ${Math.round(fW)}x${Math.round(fH)}\n`;
    lua += `local screenW, screenH = guiGetScreenSize()\n`;
    lua += `local x, y = (screenW/${Math.round(fW)}), (screenH/${Math.round(fH)})\n\nfunction renderUI()\n`;
    
    if (node.children) {
        node.children.forEach(child => {
            if (!child.absoluteBoundingBox) return;
            const { x, y, width, height } = child.absoluteBoundingBox;
            const relX = Math.round(x - fX);
            const relY = Math.round(y - fY);
            
            if (child.type === 'TEXT') {
                lua += `    dxDrawText("${child.characters}", x * ${relX}, y * ${relY}, x * ${relX + Math.round(width)}, y * ${relY + Math.round(height)}, tocolor(255, 255, 255, 255), (y * 1.0), "default-bold", "left", "top")\n`;
            } else {
                lua += `    dxDrawRectangle(x * ${relX}, y * ${relY}, x * ${Math.round(width)}, y * ${Math.round(height)}, tocolor(255, 255, 255, 255), false)\n`;
            }
        });
    }
    return lua + "end\naddEventHandler('onClientRender', root, renderUI)";
}

function generateCPP(node) {
    const { x: fX, y: fY } = node.absoluteBoundingBox;
    let cpp = "// Interface C++ ImGui\nvoid RenderFigma() {\n";
    if (node.children) {
        node.children.forEach(child => {
            if (!child.absoluteBoundingBox) return;
            const { x, y, width, height } = child.absoluteBoundingBox;
            const relX = Math.round(x - fX);
            const relY = Math.round(y - fY);
            cpp += `    ImGui::GetWindowDrawList()->AddRectFilled(ImVec2(${relX}, ${relY}), ImVec2(${relX + Math.round(width)}, ${relY + Math.round(height)}), IM_COL32(255, 255, 255, 255));\n`;
        });
    }
    return cpp + "}";
}

function copyCode() {
    navigator.clipboard.writeText(document.getElementById('code-output').innerText);
    alert("Copiado!");
}