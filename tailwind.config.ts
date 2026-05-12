import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: "#080808",
        "on-primary": "#ffffff",
        // Text
        ink: "#080808",
        "ink-strong": "#222222",
        body: "#363636",
        "body-mid": "#5a5a5a",
        mute: "#898989",
        "mute-soft": "#ababab",
        hairline: "#d8d8d8",
        // Surface
        canvas: "#ffffff",
        // Chromatic accents (category-card fills only — never buttons)
        "accent-purple": "#7a3dff",
        "accent-pink": "#ed52cb",
        "accent-blue": "#3b89ff",
        "accent-blue-deep": "#006acc",
        "accent-blue-info": "#146ef5",
        "accent-orange": "#ff6b00",
        "accent-green": "#00d722",
        "accent-yellow": "#ffae13",
        "accent-red": "#ee1d36",
        // Library "shelf room" surfaces — dark polarity of card-feature
        // used only on the library/home page to evoke a physical bookshelf.
        "shelf-bg": "#1a1a1a",
        "shelf-edge": "#3a3a3a",
        "shelf-shadow": "#0a0a0a",
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "8px",
        full: "9999px",
      },
      spacing: {
        xxs: "2px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["Inconsolata", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "display-xxl": ["80px", { lineHeight: "83.2px", letterSpacing: "-0.8px", fontWeight: "600" }],
        "display-xl": ["56px", { lineHeight: "58.24px", fontWeight: "600" }],
        "display-lg": ["44.8px", { lineHeight: "46.6px", fontWeight: "600" }],
        "display-md": ["32px", { lineHeight: "41.6px", fontWeight: "500" }],
        "display-sm": ["24px", { lineHeight: "31.2px", fontWeight: "500" }],
        "display-xs": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "eyebrow": ["15px", { lineHeight: "19.5px", letterSpacing: "1.5px", fontWeight: "500" }],
        "eyebrow-sm": ["12px", { lineHeight: "12px", letterSpacing: "0.6px", fontWeight: "500" }],
        "body-lg": ["28.8px", { lineHeight: "46.08px", letterSpacing: "-0.288px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "25.6px", letterSpacing: "-0.16px", fontWeight: "400" }],
        "body-md-strong": ["16px", { lineHeight: "25.6px", letterSpacing: "-0.16px", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "22.4px", fontWeight: "400" }],
        "body-sm-strong": ["14px", { lineHeight: "22.4px", fontWeight: "500" }],
        "caption": ["12.8px", { lineHeight: "15.36px", fontWeight: "550" }],
        "caption-mono": ["12px", { lineHeight: "18px", fontWeight: "400" }],
        "button-md": ["16px", { lineHeight: "25.6px", letterSpacing: "-0.16px", fontWeight: "500" }],
      },
      boxShadow: {
        // Webflow layered multi-stop shadow recipes
        "layered": "0 84px 24px rgba(0,0,0,0), 0 54px 22px rgba(0,0,0,0.01), 0 30px 18px rgba(0,0,0,0.04), 0 13px 13px rgba(0,0,0,0.08), 0 3px 7px rgba(0,0,0,0.09)",
        "layered-strong": "0 84px 24px rgba(0,0,0,0), 0 54px 22px rgba(0,0,0,0.02), 0 30px 18px rgba(0,0,0,0.06), 0 13px 13px rgba(0,0,0,0.10), 0 3px 7px rgba(0,0,0,0.12)",
        "modal": "0 24px 24px rgba(0,0,0,0.26), 0 6px 13px rgba(0,0,0,0.29)",
        // Library book contact shadow — sits beneath each cover on the shelf
        "book": "0 2px 4px rgba(0,0,0,0.4), 0 6px 10px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
