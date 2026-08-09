import fs from "fs";
import path from "path";

describe("Endorsement confirmation dialog styles", () => {
  it("centers the dialog in the viewport", () => {
    const stylesheetPath = path.join(__dirname, "../styles/Endorsements.css");
    const stylesheet = document.createElement("style");
    stylesheet.textContent = fs.readFileSync(stylesheetPath, "utf-8");
    document.head.appendChild(stylesheet);

    const dialog = document.createElement("dialog");
    dialog.className = "success-message confirmation-dialog";
    document.body.appendChild(dialog);

    const dialogStyles = window.getComputedStyle(dialog);
    expect(dialogStyles.position).toBe("fixed");
    expect(dialogStyles.inset).toBe("0");
    expect(dialogStyles.marginTop).toBe("auto");
    expect(dialogStyles.marginLeft).toBe("auto");
    expect(dialogStyles.marginRight).toBe("auto");
    expect(dialogStyles.marginBottom).toBe("auto");
  });
});
