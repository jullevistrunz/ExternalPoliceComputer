goToPage = API.extendFunction(
  goToPage,
  function () {},
  function (name) {
    if (name == 'searchPed') {
      tooltipFuncs.createTooltip(
        'pedSearch',
        'Enter a name to search for. Press enter or click the search button to search. Right-click the search button to open it in a new window.',
        {
          x: document
            .querySelector('.content .searchPedPage .inpContainer')
            .getBoundingClientRect().left,
          y:
            document
              .querySelector('.content .searchPedPage .inpContainer')
              .getBoundingClientRect().bottom + 5,
        },
        document.querySelector('.content .searchPedPage .inpContainer .pedInp')
          .clientWidth
      )
    }
  }
)

renderPedSearch = API.extendFunction(
  renderPedSearch,
  function () {},
  function () {
    if (
      document.querySelector(
        '.content .searchPedPage .citationArrestContainer .informationLabel'
      )
    ) {
      tooltipFuncs.createTooltip(
        'citationArrestPedSearch',
        'Add a citation or arrest report to a ped by clicking on the respective section',
        {
          x:
            document
              .querySelector(
                '.content .searchPedPage .citationArrestContainer .informationLabel'
              )
              .getBoundingClientRect().left + 100,
          y:
            document
              .querySelector(
                '.content .searchPedPage .citationArrestContainer .informationLabel'
              )
              .getBoundingClientRect().top + 10,
        },
        document.querySelector(
          '.content .searchPedPage .citationArrestContainer .informationLabel'
        ).clientWidth - 110
      )
    }
  }
)

openCitationReport = API.extendFunction(openCitationReport, function () {
  tooltipFuncs.clearAllTooltips()
})

openArrestReport = API.extendFunction(openArrestReport, function () {
  tooltipFuncs.clearAllTooltips()
})
