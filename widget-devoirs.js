// =========================================================================
// WIDGET DEVOIRS
// =========================================================================

(function () {
    const tpl = document.createElement('template');
    tpl.id = 'template-homework';
    tpl.innerHTML = `
    <div class="editor-container">
        <div class="editor-content" contenteditable="true" oninput="saveBoard()" style="line-height:1.3;">
            <span style="color:#D4C9C7;font-size:25px;font-weight:bold;">✍🏻 Devoirs à noter </span><br>
            <span style="color:red;background-color:#F7E02A;font-size:38px;font-weight:bold;">Pour</span><br>
			<br>
            <span style="color:#f7639f;font-size:35px;font-weight:bold;">&nbsp;&nbsp;🔴 </span><br><br>
			<span style="color:#12a2e0;font-size:35px;font-weight:bold;">&nbsp;&nbsp;🔵 </span><br><br>
            <span style="color:#1e6337;font-size:35px;font-weight:bold;">&nbsp;&nbsp;🟢 </span><br><br>
        </div>
    </div>`;
    document.body.appendChild(tpl);
})();
