const files = {
  html: '<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>My Website</title>\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, world! 👋</h1>\n    <p>Edit the HTML, CSS and JavaScript tabs, then build your website.</p>\n    <button onclick="sayHello()">Click me</button>\n  </main>\n</body>\n</html>',
  css: 'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: Arial, sans-serif;\n  background: linear-gradient(135deg, #dbeafe, #ede9fe);\n}\n.card {\n  padding: 32px;\n  max-width: 520px;\n  text-align: center;\n  background: white;\n  border-radius: 18px;\n  box-shadow: 0 15px 40px #0002;\n}\nbutton { padding: 10px 18px; cursor: pointer; }',
  js: 'function sayHello() {\n  alert("Your website is running!");\n}'
};
let activeFile = 'html';
let editor;
const language = document.getElementById('language');
const websiteTabs = document.getElementById('websiteTabs');
const preview = document.getElementById('preview');
const output = document.getElementById('output');
const inputBox = document.getElementById('inputBox');
const statusText = document.getElementById('statusText');
const resultTitle = document.getElementById('resultTitle');

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.getElementById('editor'), { value: files.html, language: 'html', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14 });
  editor.onDidChangeModelContent(() => { files[activeFile] = editor.getValue(); });
  buildWebsite();
});

function setMode() {
  const website = language.value === 'website';
  websiteTabs.classList.toggle('hidden', !website);
  document.getElementById('buildButton').classList.toggle('hidden', !website);
  document.getElementById('runButton').classList.toggle('hidden', website);
  inputBox.classList.toggle('hidden', website);
  preview.classList.toggle('hidden', !website);
  output.classList.toggle('hidden', website);
  resultTitle.textContent = website ? 'Website Preview' : 'Program Output';
  if (!website && editor) switchLanguage(language.value);
  if (website && editor) { switchLanguage(activeFile === 'html' ? 'html' : activeFile === 'css' ? 'css' : 'javascript'); }
}
function switchLanguage(lang) {
  monaco.editor.setModelLanguage(editor.getModel(), lang === 'cpp' ? 'cpp' : lang);
}
language.addEventListener('change', setMode);
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  if (editor) files[activeFile] = editor.getValue();
  activeFile = tab.dataset.file;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  editor.setValue(files[activeFile]);
  switchLanguage(activeFile === 'html' ? 'html' : activeFile === 'css' ? 'css' : 'javascript');
}));

document.getElementById('buildButton').addEventListener('click', buildWebsite);
function buildWebsite() {
  if (!editor) return;
  files[activeFile] = editor.getValue();
  const doc = files.html.replace('</head>', `<style>${files.css}</style></head>`).replace('</body>', `<script>${files.js.replace(/<\/script>/gi, '<\\/script>')}</script></body>`);
  preview.srcdoc = doc;
  statusText.textContent = 'Website built successfully';
}

document.getElementById('runButton').addEventListener('click', async () => {
  if (!editor) return;
  files[activeFile] = editor.getValue();
  output.classList.remove('hidden'); output.textContent = 'Running...'; statusText.textContent = 'Executing in sandbox...';
  try {
    const response = await fetch('/api/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: language.value, code: editor.getValue(), stdin: document.getElementById('stdin').value }) });
    const result = await response.json();
    output.textContent = (result.stdout || '') + (result.stderr ? `\n${result.stderr}` : '') || 'No output';
    statusText.textContent = result.success ? `Completed in ${result.executionTime}ms` : 'Execution failed';
  } catch (error) { output.textContent = `Request failed: ${error.message}`; statusText.textContent = 'Connection error'; }
});
document.getElementById('clearButton').addEventListener('click', () => { output.textContent = ''; preview.srcdoc = ''; statusText.textContent = 'Ready'; });
