goToPage = API.extendFunction(
  goToPage,
  function () {},
  function (name) {
    if (name == 'shift') {
      tooltipFuncs.createTooltip(
        'shiftInp',
        'You can start and end your shift by clicking the respective buttons.',
        {
          x: document
            .querySelector('.content .shiftPage .startShift')
            .getBoundingClientRect().left,
          y:
            document
              .querySelector('.content .shiftPage .startShift')
              .getBoundingClientRect().bottom + 5,
        },
        document.querySelector('.content .shiftPage .startShift').clientWidth
      )
      if (
        document.querySelector('.content .shiftPage .currentShift').children[2]
      ) {
        tooltipFuncs.createTooltip(
          'shiftCourtCases',
          'If you gave someone a citation or arrested them during this shift, the respective court case number will show up here. Click them to open their court case on the court page. Right-click to open it in a new window.',
          {
            x:
              document
                .querySelector('.content .shiftPage .currentShift')
                .children[2].getBoundingClientRect().right - 400,
            y:
              document
                .querySelector('.content .shiftPage .currentShift')
                .children[2].getBoundingClientRect().bottom + 5,
          },
          400
        )
      }
      if (
        document.querySelector('.content .shiftPage .currentShift').children[3]
      ) {
        tooltipFuncs.createTooltip(
          'shiftIncidents',
          'Incidents that have been created by a callout can be found here. Click to view, edit or create incidents.',
          {
            x: document
              .querySelector('.content .shiftPage .currentShift')
              .children[3].getBoundingClientRect().left,
            y:
              document
                .querySelector('.content .shiftPage .currentShift')
                .children[3].getBoundingClientRect().bottom + 5,
          },
          400
        )
      }
    }
  }
)

openIncidentReports = API.extendFunction(
  openIncidentReports,
  function () {
    tooltipFuncs.clearAllTooltips()
  },
  function () {
    tooltipFuncs.createTooltip(
      'shiftIncidentDescriptionLinks',
      'Click a link to open its page. Right-click to open its page in a new window.',
      {
        x: document
          .querySelector('#incidentDescription')
          .getBoundingClientRect().left,
        y:
          document.querySelector('#incidentDescription').getBoundingClientRect()
            .top -
          54 -
          10,
      },
      document.querySelector('#incidentDescription').clientWidth
    )
  }
)

document
  .querySelector('.content .shiftPage .incidentReport .close')
  .addEventListener('click', function () {
    tooltipFuncs.clearAllTooltips()
  })
