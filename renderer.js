let hotkeys = []
const newHotkeyBtn = document.querySelector('#newHotkeyBtn')
const modal = document.querySelector('#modalcontainer')
const hotkeySaver = document.querySelector('#hotkeySaver')
const hotkeysContainer = document.createElement('div')
hotkeysContainer.id = 'hotkeysContainer'
document.body.append(hotkeysContainer)
hotkeySaver.addEventListener('click', () => {
    hotkeys.forEach((hotkey, index) => {
        let valueInput = document.querySelector(`#hotkeyValue${index}`)
        valueInput.value = convertTypes(valueInput.value, hotkey.type)
    })
    window.electronAPI.sendData(hotkeys)

})
window.electronAPI.onDataSaved((message) => {
    console.log('Saved')
    alert(message); // Show success message
});

window.electronAPI.getData()
window.electronAPI.onDataReceived((data) => {
    hotkeys = data.hotkeys || []
    updateUI()
    if (!hotkeys) {
        setTimeout(() => window.electronAPI.getData(), 5000)
    }
});

newHotkeyBtn.addEventListener('click', () => {
    showModal()
    window.addEventListener('keydown', addNewHotkey)
})

function showModal() {
    modal.style.display = 'block'
}

function hideModal() {
    modal.style.display = 'none'
}

function addNewHotkey(e) {
    window.removeEventListener('keydown', addNewHotkey)
    hotkeys.push({ key: e.key.toUpperCase(), oscAddress: '', type: 'f', value: null, keystate: 'DOWN' })
    updateUI()
    hideModal()
}

function updateUI() {
    hotkeys.forEach((hotkey, index) => {
        if (!document.querySelector(`[data-index="${index}"]`)) {
            const item = document.createElement("div");
            item.className = "hotkey-item";
            let inputType = checkType(hotkey.type)
            item.innerHTML = `
            <span>${hotkey.key} → (Address: <input placeholder="Parameter Address" id="hotkeyAddress${index}" name="oscAddress">
            Type: <select name="type" id="hotkeytype${index}">
      <option value="f">Float</option>
      <option value="i">Integer</option>
      <option value="s">String</option>
      <option value="T">True</option>
      <option value="F">False</option>
    </select>
    Value: <input type="${inputType.type}" ${inputType.disabled} name="value" id="hotkeyValue${index}" steps="0">
     Key state: <select name="keystate" id="hotkeyState${index}">
      <option value="DOWN">On keydown</option>
      <option value="UP">On keyup</option></select>)</span>
<button class="btn remove-btn" data-index="${index}">Remove</button>
        `;
            hotkeysContainer.appendChild(item);
            document.querySelector(`#hotkeytype${index} option[value="${hotkey.type}"]`).selected = true
            let keyStateInput = document.querySelector(`#hotkeyState${index}`)
            keyStateInput.value = hotkey.keystate
            let addressInput = document.querySelector(`#hotkeyAddress${index}`)
            addressInput.value = hotkey.oscAddress
            let valueInput = document.querySelector(`#hotkeyValue${index}`)
            valueInput.value = hotkey.value

            let select = item.getElementsByTagName('select')
            select.type.onchange = addressInput.onchange = valueInput.onchange = keyStateInput.onchange = function () {
                hotkeys[index][this.name] = this.value
                if (this.name === 'type') {
                    let typeInfo = checkType(this.value)
                    valueInput.disabled = typeInfo.disabled
                    valueInput.type = typeInfo.type

                }
            }
        }
    })
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            removeHotkey(index);
        });
    })
}

function removeHotkey(index) {
    document.querySelector(`[data-index="${index}"]`).parentNode.remove()
    hotkeys.splice(index, 1)
    updateUI()
}
function checkType(type) {
    if (type === 'f' || type === 'i') return { type: 'number', disabled: '' }
    if (type === 's') return { type: 'text', disabled: '' };
    /*boolean type*/return { type: 'text', disabled: 'disabled' };
}
function convertTypes(val, type) {
    if (type === 's') return String(val)
    if (type === 'i') return Math.round(Number(val))
    return Number(val)

}
// hotkey design: hotkeys = [{Key:S,address:sfdsd},{Key:a}]
// store hotkey indexes to represent the correct value in the frontend
/*
types: 'f':float, 's': str, 'i': int, 'F': false, 'T':true
*/