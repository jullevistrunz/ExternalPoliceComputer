goToPage = API.extendFunction(
  goToPage,
  function () {},
  function (name) {
    if (name == 'searchCar') {
      tooltipFuncs.createTooltip(
        'carSearch',
        'Enter a license plate number to search for. Press enter or click the search button to search. Right-click the search button to open it in a new window.',
        {
          x: document
            .querySelector('.content .searchCarPage .inpContainer')
            .getBoundingClientRect().left,
          y:
            document
              .querySelector('.content .searchCarPage .inpContainer')
              .getBoundingClientRect().bottom + 5,
        },
        document.querySelector('.content .searchCarPage .inpContainer .carInp')
          .clientWidth
      )
    }
  }
)
