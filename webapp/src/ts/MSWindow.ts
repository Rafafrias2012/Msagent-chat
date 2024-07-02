export interface MSWindowConfig {
    width: number,
    height: number,
    hasClose: boolean;
    startPosition: MSWindowStartPosition
}

export enum MSWindowStartPosition {
    TopLeft,
    Center
}

export class MSWindow {
    wnd: HTMLDivElement;
    config: MSWindowConfig;
    titlebar: HTMLDivElement;
    body: HTMLDivElement;
    shown: boolean;
    dragging: boolean;
    x: number;
    y: number;
    constructor(wnd: HTMLDivElement, config: MSWindowConfig) {
        this.shown = false;
        this.wnd = wnd;
        this.config = config;
        this.wnd.style.width = config.width + "px";
        this.wnd.style.height = config.height + "px";
        let titlebar = this.wnd.querySelector("div.ms-window-titlebar");
        let body = this.wnd.querySelector("div.ms-window-body");
        if (!titlebar || !body)
            throw new Error("MSWindow is missing titlebar or body element.");
        this.titlebar = titlebar as HTMLDivElement;
        this.body = body as HTMLDivElement;
        // Register window move handlers
        this.dragging = false;
        switch (this.config.startPosition) {
            case MSWindowStartPosition.TopLeft: {
                this.x = 0;
                this.y = 0;
                break;
            }
            case MSWindowStartPosition.Center: {
                this.x = (document.documentElement.clientWidth / 2) - (this.config.width / 2);
                this.y = (document.documentElement.clientHeight / 2) - (this.config.height / 2);
                break;
            }
            default: {
                throw new Error("Invalid start position");
            }
        }
        this.setLoc();
        this.titlebar.addEventListener('mousedown', () => {
            this.dragging = true;
            document.addEventListener('mouseup', () => {
                this.dragging = false;
            }, {once: true});
        });
        document.addEventListener('mousemove', e => {
            if (!this.dragging) return;
            this.x += e.movementX;
            this.y += e.movementY;
            this.setLoc();
        });
        window.addEventListener('resize', () => {
            this.setLoc();
        });
    }

    show() {
        this.wnd.style.display = "block";
        this.shown = true;
    }

    hide() {
        this.wnd.style.display = "none";
        this.shown = false;
    }

    private setLoc() {
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > document.documentElement.clientWidth - this.config.width) this.x = document.documentElement.clientWidth - this.config.width;
        if (this.y > document.documentElement.clientHeight - this.config.height) this.y = document.documentElement.clientHeight - this.config.height;
        this.wnd.style.top = this.y + "px";
        this.wnd.style.left = this.x + "px";
    }
}