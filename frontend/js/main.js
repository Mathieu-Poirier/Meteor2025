document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.title-t');
  const sub = document.querySelector('.title-t2');

  title.addEventListener('animationend', () => {
    console.log('First animation done');
    sub.style.animation = 'fadeIn 2s ease-in-out forwards';
  });
});

