document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.title-t');
  const subtitle = document.querySelector('.title-t2');
  const button = document.querySelector('.title-btn');
  const star = document.querySelector('.star');

  // Chain fade-ins: title → subtitle → button → star
  title.addEventListener('animationend', () => {
    subtitle.style.animation = 'fadeIn 1.25s ease-in-out forwards';
  });

  subtitle.addEventListener('animationend', () => {
    button.style.animation = 'fadeIn 1.25s ease-in-out forwards';
  });

  button.addEventListener('animationend', () => {
    star.style.opacity = 1;
  });
});
