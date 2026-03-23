data.forEach(item => {
  const img = document.createElement('img');
  img.src = item.image;
  document.body.appendChild(img);
});
