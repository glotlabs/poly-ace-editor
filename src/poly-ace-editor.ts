class AceEditorElement extends HTMLElement {
  private editor: any;
  private contentObserver: MutationObserver;
  private abortController: AbortController;
  private editorElem: HTMLElement;
  public value: string = "";

  static register() {
    customElements.define("poly-ace-editor", AceEditorElement);
  }

  constructor() {
    super();

    const stylesheetElem = this.getStylesheetElement();
    this.editorElem = this.createEditorElement();

    const shadow = this.attachShadow({ mode: "closed" });

    if (stylesheetElem !== null) {
      shadow.appendChild(stylesheetElem);
    }

    shadow.appendChild(this.editorElem);

    // @ts-ignore
    if (!window.ace) {
      console.error(
        "poly-ace-editor requires that the ace.js library is loaded first"
      );
      throw new Error("ace.js library is not loaded");
    }

    // @ts-ignore
    this.editor = ace.edit(this.editorElem);
    this.editor.renderer.attachToShadowRoot();

    this.setContent(this.textContent || "");

    this.editor.getSession().on("change", () => {
      this.value = this.editor.getValue();

      const event = new Event("change", {
        bubbles: true,
      });

      this.dispatchEvent(event);
    });

    this.contentObserver = new MutationObserver(() => {
      this.setContent(this.textContent || "");
    });

    this.abortController = new AbortController();
  }

  public connectedCallback() {
    if (this.isConnected) {
      this.startContentObserver();
      this.startResizeListener();
      this.startFocusListener();
    }
  }

  public disconnectedCallback() {
    this.contentObserver.disconnect();
    this.abortController.abort();
  }

  private setContent(content: string) {
    if (content !== this.value) {
      this.value = content;
      this.editor.setValue(content, 1);
    }
  }

  private getStylesheetElement(): Node | null {
    const stylesheetId = this.getAttribute("stylesheet-id");

    if (stylesheetId === null) {
      return null;
    }

    const elem = document.getElementById(stylesheetId);
    if (elem === null) {
      return null;
    }

    return elem.cloneNode();
  }

  private createEditorElement(): HTMLDivElement {
    const editorElem = document.createElement("div");
    return editorElem;
  }

  static get observedAttributes() {
    return [
      "editor-class",
      "height",
      "keyboard-handler",
      "theme",
      "mode",
      "show-print-margin",
      "show-gutter",
    ];
  }

  public attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string
  ) {
    switch (name) {
      case "editor-class":
        this.editorElem.classList.value = newValue;
        break;

      case "height":
        this.editorElem.style.height = newValue;
        break;

      case "keyboard-handler":
        this.editor.setKeyboardHandler(newValue);
        break;

      case "theme":
        this.editor.setTheme(newValue);
        break;

      case "mode":
        this.editor.getSession().setMode(newValue);
        break;

      case "use-soft-tabs":
        this.editor.setOption("useSoftTabs", newValue === "true");
        break;

      case "tab-size":
        this.editor.setOption("tabSize", parseInt(newValue) || 0);
        break;

      case "show-print-margin":
        this.editor.setShowPrintMargin(newValue === "true");
        break;

      case "show-gutter":
        this.editor.renderer.setShowGutter(newValue === "true");
        break;
    }
  }

  private startContentObserver() {
    this.contentObserver.observe(this, {
      characterData: true,
      subtree: true,
      childList: true,
    });
  }

  private startResizeListener() {
    window.addEventListener(
      "resize",
      (_event) => {
        window.requestAnimationFrame(() => {
          this.editor.resize();
        });
      },
      {
        signal: this.abortController.signal,
        passive: true,
      }
    );
  }

  private startFocusListener() {
    this.addEventListener(
      "focus",
      (_event) => {
        this.editor.focus();
      },
      {
        signal: this.abortController.signal,
        passive: true,
      }
    );
  }
}

export { AceEditorElement };
