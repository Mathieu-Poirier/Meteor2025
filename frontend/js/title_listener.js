document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.title-t');
  const sub = document.querySelector('.title-t2');
  const title_btn = document.querySelector('.title-btn');

  title.addEventListener('animationend', () => {
    sub.style.animation = 'fadeIn 1.25s ease-in-out forwards';
  });
  sub.addEventListener('animationend', () => {
    title_btn.style.animation = 'fadeIn 1.25s ease-in-out forwards';
  });
});