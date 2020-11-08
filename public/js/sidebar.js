/*$("menu-toggle").click( function(e){
    e.preventDefault();
    $("#wrapper").toggleClass("menu-displayed");
});
*/
const menutogg = document.getElementById('menu-toggle');
const wrapp = document.getElementById('wrapper');

menutogg.addEventListener('click', () => {
    wrapp.classList.toggle("menuDisplayed");
});



const menutogg1 = document.getElementById('menu-toggle-rt');
const wrapp1 = document.getElementById('wrapper');

menutogg1.addEventListener('click', () => {
    wrapp1.classList.toggle("menuDisplayedrt");
});
