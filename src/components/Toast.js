//@ts-nocheck
let toastQueue = [];
import { useEffect } from "react";
export function createToast(message, status = true, duration = 4000) {
  // Check for duplicate message
  if (!toastQueue.includes(message)) {
    toastQueue.push(message); // Add message to the queue only if unique

    const displayToast = () => {
      const toastParent = document.querySelector("#toastParent");
      const toastElement = document.createElement("div");
      const toastTxtBox = document.createElement("div");
      const toastTextHeading = document.createElement("span");
      const toastText = document.createElement("span");
      /* Toast Parent */
      toastParent.style.position = "absolute";
      toastParent.style.left = "1rem";
      toastParent.style.bottom = "1rem";
      toastParent.style.width = "25%"; // Adjust the width here
      toastParent.style.padding = "1rem 2rem";
      toastParent.style.gap = "1rem";
      /* Text Flexbox */
      toastTxtBox.style.display = "flex";
      toastTxtBox.style.flexDirection = "column";
      toastTxtBox.style.width = "100%";
      toastTxtBox.style.gap = "5px";
      /* Toast Box Styling */
      toastElement.classList.add("toast");
      toastElement.style.zIndex = "1000"; // Adjust the z-index here
      toastElement.style.padding = "1em 1.5em"; // Adjust the padding here
      toastElement.style.borderRadius = "10px"; // Adjust the border radius here
      toastElement.style.transition = "all 1s ease-in-out";
      toastElement.style.backgroundColor = status ? "#eef4e6" : "#f9e4e4"; // Adjust the background color here
      toastElement.style.border = "1px solid #509308"; // Adjust the border here
      toastElement.style.borderLeft =
        `10px solid ` + (status ? "#509308" : "#d50000"); // Adjust the border color here
      toastElement.style.opacity = "0";
      toastElement.style.transform = "translateX(-150%)";
      toastElement.style.transition = "all 0.6s ease-in";
      toastElement.style.boxShadow = "6px 6px 8px 0px #62735050";
      /* Toast Texts Styling */
      toastTextHeading.textContent = status ? "Success!" : "Error.";
      toastTextHeading.style.fontSize = "1rem";
      toastTextHeading.style.fontWeight = "bold";

      toastText.textContent = toastQueue.shift();
      toastText.style.fontSize = "0.8rem"; // Adjust the font size here
      toastText.style.textAlign = "start";
      toastText.style.paddingRight = "3em";
      //ToastText.style.text = "bold";

      toastTxtBox.appendChild(toastTextHeading);
      toastTxtBox.appendChild(toastText);
      toastElement.appendChild(toastTxtBox);
      toastParent.appendChild(toastElement);

      // Entry Animation
      setTimeout(() => {
        toastElement.style.opacity = "1";
        toastElement.style.transform = "translateX(0)";
      }, 100);

      // Exit Animation
      setTimeout(() => {
        toastElement.style.opacity = "0";
        toastElement.style.transform = "translateX(-150%)";
      }, duration);

      setTimeout(() => {
        toastElement.remove();
      }, duration + 500);
    };

    // Optional delay to address potential async issues (similar to previous example)
    setTimeout(displayToast, 0);
  }
}

export function useEffectToast() {
  useEffect(() => {
    const body = document.querySelector("body");
    const toastParent = document.createElement("div");
    toastParent.id = "toastParent";
    toastParent.style.display = "flex";
    toastParent.style.flexDirection = "column-reverse";

    body.appendChild(toastParent);
  }, []);
}
