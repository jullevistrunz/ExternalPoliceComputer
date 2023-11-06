const pagesToShow = {
  map: true,
  alphabet: true,
  searchPed: true,
  searchCar: true,
  court: true,
  shift: true,
}

for (const page of Object.keys(pagesToShow)) {
  if (!pagesToShow[page]) {
    document.querySelector(`.header .${page}`).classList.add('hidden')
  }
}
