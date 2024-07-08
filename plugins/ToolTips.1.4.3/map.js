goToPage = API.extendFunction(
  goToPage,
  function () {},
  function (name) {
    if (name == 'map') {
      tooltipFuncs.createTooltip(
        'mapMove',
        'Use your mousewheel to move the map vertically and hold shift to move horizontally.',
        {
          x:
            document.querySelector('.content .mapPage').getBoundingClientRect()
              .left + 10,
          y:
            document.querySelector('.content .mapPage').getBoundingClientRect()
              .top + 10,
        },
        500
      )
      tooltipFuncs.createTooltip(
        'mapZoom',
        'Use this input element to control the zoom.',
        {
          x:
            document
              .querySelector('.content .mapPage .mapZoom')
              .getBoundingClientRect().right + 10,
          y:
            document
              .querySelector('.content .mapPage .mapZoom')
              .getBoundingClientRect().top - 10,
        },
        300
      )
    }
  }
)
