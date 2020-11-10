const copy = document.querySelector('#copy')
const copyText = document.getElementById("myInput")

// function myFunction() {
//             const copyText = document.getElementById("myInput");
//             copyText.select();
//             copyText.setSelectionRange(0, 99999)
//             document.execCommand("copy");
//             alert("Copied");
//           }

copy.addEventListener('click', () => {
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
    alert("Copied");
})


