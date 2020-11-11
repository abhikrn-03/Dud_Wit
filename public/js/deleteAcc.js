const deleteForm = document.querySelector('#deleteForm')
const confirm = document.querySelector('#confirm')
const message = document.querySelector('#message')
var penName = document.querySelector('#penName')

deleteForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const value = confirm.value
    if (value === penName.textContent){
        await fetch ('/users/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                'penName': penName.textContent
            })
        }).then((response) => {
            location.replace('/')
        }).catch((e) => {
            throw new Error('Interval Server Error')
        })
    }
    else{
        message.textContent = 'Incorrect Pen Name!'
    }
})