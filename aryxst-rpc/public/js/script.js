document.querySelectorAll('.change-name').forEach((button) => {
 button.addEventListener('click', () => {
  const newName = prompt('Enter new name');
  if (!newName) return;
  fetch('/change-name', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify({
    name: button.parentElement.textContent,
    newName,
   }),
  }).finally(() => {
   window.location.reload();
  });
 });
});

document.querySelectorAll("input[name='priority']").forEach((input) => {
 input.addEventListener('focus', () => {
  input.dataset.previousValue = input.value;
  input.select();
 });
 input.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
   input.blur();
   if (e.target.value === input.dataset.previousValue) return;
   if (!confirm('Are you sure you want to change the priority?')) return;
   fetch('/change-priority', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     name: e.target.dataset.isBoundTo,
     priority: +e.target.value,
    }),
   }).finally(() => {
    window.location.reload();
   });
  }
 });
});

document.querySelector('#add-program').addEventListener('click', () => {
 const name = prompt('(1 of 3): Enter program name');
 if (!name) return;
 const executablePath = prompt('(2 of 3): Enter program executable path');
 if (!executablePath) return;
 fetch('/is-valid-path', {
  method: 'POST',
  headers: {
   'Content-Type': 'application/json',
  },
  body: JSON.stringify({
   path: executablePath,
  }),
 })
  .then((res) => res.json())
  .then((data) => {
   if (!data.success) {
    alert('Invalid executable path');
    return;
   }
   const executableName = executablePath.split('\\').pop().split('/').pop();
   const icon = prompt('(3 of 3): Enter icon URL/Asset tag (optional)');
   if (!icon) {
    alert('Must provide an icon!');
    return;
   }
   fetch('/add-program', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     name,
     icon: icon || '',
     executablePath,
     executableName,
     priority: 0,
    }),
   }).finally(() => {
    window.location.reload();
   });
  });
});
document.querySelectorAll('.delete-program').forEach((button) => {
 button.addEventListener('click', () => {
  if (!confirm('Are you sure you want to delete this program?')) return;
  fetch('/delete-program', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify({
    name: button.parentElement.dataset.isBoundTo,
   }),
  }).finally(() => {
   window.location.reload();
  });
 });
});
