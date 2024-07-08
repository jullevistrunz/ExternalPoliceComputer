goToPage = API.extendFunction(
  goToPage,
  function () {},
  function (name) {
    if (name == 'court') {
      tooltipFuncs.createTooltip(
        'courtSearch',
        "Enter a defendant's name to limit results to. Press enter or click the search button to search.",
        {
          x: document
            .querySelector('.content .courtPage .inpContainer')
            .getBoundingClientRect().left,
          y:
            document
              .querySelector('.content .courtPage .inpContainer')
              .getBoundingClientRect().bottom + 5,
        },
        document.querySelector('.content .courtPage .inpContainer .pedInp')
          .clientWidth
      )
      if (
        document.querySelector(
          '.content .courtPage .list .informationLabelContainer .pedName'
        )
      ) {
        tooltipFuncs.createTooltip(
          'courtDefendantClick',
          "Click on a defendant's name to open their ped search. Right-click to open it in a new window.",
          {
            x: document
              .querySelector(
                '.content .courtPage .list .informationLabelContainer .pedName'
              )
              .getBoundingClientRect().left,
            y:
              document
                .querySelector(
                  '.content .courtPage .list .informationLabelContainer .pedName'
                )
                .getBoundingClientRect().bottom + 5,
          },
          400
        )
      }
    }
  }
)
