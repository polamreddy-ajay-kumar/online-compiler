# Online Compiler

A browser-based coding workspace for building websites and running programs.

## Features

- HTML/CSS/JavaScript website editor with live preview
- Monaco Editor in the browser
- Run JavaScript, Python, Java, C, and C++ through Docker
- Sandboxed execution with timeout, memory, CPU, and network limits
- Input and output panels

## Run locally

Requirements: Node.js 20+ and Docker.

```bash
npm install
npm start
```

Open http://localhost:3000.

For website mode, choose **HTML Website**, edit the HTML/CSS/JS tabs, then click **Build Website**. For programming languages, select a language, write code, optionally provide stdin, and click **Run Code**.

> Never expose the execution API to the public internet without authentication, rate limiting, stronger container isolation, and operational monitoring.
