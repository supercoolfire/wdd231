const openButton1 = document.querySelector("#openButton1");
const openButton2 = document.querySelector("#openButton2");
const openButton3 = document.querySelector("#openButton3");

const dialogBox = document.querySelector("#dialogBox");
const dialogBoxText = document.querySelector("#dialogBox div");
const closButton = document.querySelector("#closButton");

// "show the dialog" button opens the dialog modality
openButton1.addEventListener("click", () => {
    dialogBoxText.innerHTML="An Ape has eaten 95 calories"
    dialogBox.showModal();
});
openButton2.addEventListener("click", () => {
    dialogBoxText.innerHTML="Monkey doesn't like orange"
    dialogBox.showModal();
});
openButton3.addEventListener("click", () => {
    dialogBoxText.innerHTML="Gorilla is very srong adhesive"
    dialogBox.showModal();
});
// "Close" button closes the dialog
closButton.addEventListener("click", () => {
    dialogBox.close();
});