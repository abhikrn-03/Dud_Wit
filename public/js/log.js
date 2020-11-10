const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container1');


signUpButton.addEventListener('click', () => {
	container1.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container1.classList.remove("right-panel-active");
});

$(".passview").hover(
	function () {
		$('.pass').attr("type", "text")
		$('.pass').attr("type", "text")
		$(this).removeClass('fa-eye-slash').addClass('fa-eye')
	}, function () {
		$('.pass').attr("type", "password")
		$('.pass').attr("type", "password")
		$(this).removeClass('fa-eye').addClass('fa-eye-slash')
	}
)