const IMAGE_BOUNDS = [-5701.589, -4046.4789, 6734.6303, 8388.2231]
const EDGE_INDEX_CELL_SIZE = 50
const EDGE_SNAP_SEARCH_RADIUS = 100

let _ignoreOneWays = false

let _graph = null
let _map = null

let _startNode = null
let _endNode = null

let _startMarker = null
let _endMarker = null
let _routeLayer = null

let _edgeIndex = null

let _tempRouting = null

let _playerMarker = null

let _activeRoutePath = null
let _activeRoutePathEdges = null
let _activeRoutePathEdgePrefixMeters = null

let _activeRouteNodeEvents = null

;(async function () {
  const config = await getConfig()
  const language = await getLanguage()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('map')

  if (config.mapSmoothPlayerIcon) {
    const playerIconStyle = document.createElement('style')
    playerIconStyle.textContent = `.playerIcon { transition: all ${config.webSocketUpdateInterval}ms; }`
    document.head.appendChild(playerIconStyle)
  }

  const [minX, minY, maxX, maxY] = IMAGE_BOUNDS
  const leafletBounds = [
    [minY, minX],
    [maxY, maxX],
  ]

  _map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 2,
    zoomSnap: 0.25,
  })
  L.imageOverlay('/image/map.png', leafletBounds).addTo(_map)
  _map.fitBounds(leafletBounds)

  _map.createPane('navigation')
  _map.getPane('navigation').style.zIndex = 2000
  _map.createPane('playerIcon')
  _map.getPane('playerIcon').style.zIndex = 3000
  _map.createPane('postalCodes')
  _map.getPane('postalCodes').style.zIndex = 1000

  document.querySelector('#map .leaflet-control-zoom-in').title =
    language.map.zoomIn
  document.querySelector('#map .leaflet-control-zoom-out').title =
    language.map.zoomOut

  const RouteInstructionsControl = L.Control.extend({
    options: {
      position: 'topright',
    },
    onAdd() {
      const container = L.DomUtil.create(
        'div',
        'leaflet-bar routeInstructionsControl'
      )

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      L.DomUtil.create('div', 'direction', container)
      L.DomUtil.create('div', 'instructions', container)

      return container
    },
  })

  _map.addControl(new RouteInstructionsControl())

  const roads = await (await fetch('/roads.geojson')).json()

  // DEBUG: draw geojson roads
  // L.geoJSON(roads, {
  //   style: { color: 'var(--color-accent)', weight: 3 },
  //   coordsToLatLng: gameCoordToLatLng,
  // }).addTo(_map)

  _graph = buildGraphFromGeoJSON(roads)

  _edgeIndex = buildEdgeIndex(_graph)

  const coordsWs = new WebSocket(`ws://${location.host}/ws`)
  coordsWs.onopen = () => coordsWs.send('interval/playerCoords')

  let playerCoords = null
  let destinationCoords = null

  coordsWs.onmessage = async (event) => {
    const config = await getConfig()
    const data = JSON.parse(event.data).response
    playerCoords = data.Coords
    const heading = data.Heading

    const iconSize = config.mapPlayerIconSize
    const icon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"  style="rotate: -${heading}deg;"><path d="M24.5 4L9 44L24.5 34.9091L40 44L24.5 4Z" fill="var(--color-accent-secondary)" stroke="var(--color-background)" stroke-width="4" stroke-linejoin="round"/></svg>`,
      className: 'playerIcon',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
    })

    if (_playerMarker) {
      _playerMarker.setLatLng(gameCoordToLatLng(playerCoords))
      document.querySelector('.playerIcon svg').style.rotate = `-${heading}deg`
    } else {
      _playerMarker = L.marker(gameCoordToLatLng(playerCoords), {
        icon: icon,
        pane: 'playerIcon',
      }).addTo(_map)
    }

    if (_activeRouteNodeEvents && _activeRouteNodeEvents.length > 0) {
      const nearestOnRoute = findNearestActiveRouteEdgePoint(playerCoords)
      const nextEvent =
        _activeRouteNodeEvents[0].events && _activeRouteNodeEvents[0].events[0]
          ? _activeRouteNodeEvents[0].events[0]
          : null

      displayRouteInstructions(
        nextEvent ? nextEvent.type : null,
        getDistanceToNextRouteNodeEventMeters(
          nearestOnRoute,
          _activeRouteNodeEvents[0]
        ),
        nextEvent ? nextEvent.toStreet : null
      )

      if (
        nearestOnRoute &&
        nearestOnRoute.from == _activeRouteNodeEvents[0].nodeId
      ) {
        _activeRouteNodeEvents.shift()
      }
    } else if (_routeLayer) {
      const nearestOnRoute = findNearestActiveRouteEdgePoint(playerCoords)
      displayRouteInstructions(
        null,
        getRemainingActiveRouteLengthMeters(nearestOnRoute),
        null
      )
    } else {
      document
        .querySelector('.routeInstructionsControl')
        .classList.add('hidden')
    }

    if (destinationCoords && !_routeLayer) {
      drawRoute([playerCoords, destinationCoords])
    } else if (destinationCoords && !isCoordOnActiveRoute(playerCoords)) {
      drawRoute([playerCoords, destinationCoords])
    } else if (!destinationCoords && _routeLayer) {
      clearRoute()
    }
  }

  const calloutEventWs = new WebSocket(`ws://${location.host}/ws`)
  calloutEventWs.onopen = () => calloutEventWs.send('calloutEvent')

  calloutEventWs.onmessage = (event) => {
    const data = JSON.parse(event.data).response
    destinationCoords = data.Coords

    if (data.AcceptanceState != 1) destinationCoords = null
  }

  if (config.mapDrawPostalCodeSet) {
    const activePostalSet = await (
      await fetch('/data/activePostalCodeSet')
    ).json()

    const postalCodes = activePostalSet.Codes

    const postalCodeMarkers = []
    const postalCodeIconSize = [32, 16]

    for (const postalCode of postalCodes) {
      const postalCodeIcon = L.divIcon({
        html: postalCode.Number,
        className: `postalCodeIcon`,
        iconSize: postalCodeIconSize,
        iconAnchor: [postalCodeIconSize[0] / 2, postalCodeIconSize[1] / 2],
      })
      const postalCodeMarker = L.marker(
        gameCoordToLatLng([postalCode.X, postalCode.Y]),
        {
          icon: postalCodeIcon,
          pane: 'postalCodes',
        }
      ).addTo(_map)
      postalCodeMarkers.push(postalCodeMarker)
    }

    updatePostalCodeVisibility()

    function getMarkerBoundingBox(marker) {
      const p = _map.latLngToLayerPoint(marker.getLatLng())
      const [w, h] = postalCodeIconSize
      return {
        minX: p.x - w / 2,
        maxX: p.x + w / 2,
        minY: p.y - h / 2,
        maxY: p.y + h / 2,
      }
    }

    function boundingBoxesOverlap(a, b) {
      return !(
        a.maxX < b.minX ||
        a.minX > b.maxX ||
        a.maxY < b.minY ||
        a.minY > b.maxY
      )
    }

    function updatePostalCodeVisibility() {
      const bounds = _map.getBounds()

      const visibleMarkers = postalCodeMarkers.filter((marker) =>
        bounds.contains(marker.getLatLng())
      )

      visibleMarkers.sort((a, b) => {
        const pa = _map.latLngToContainerPoint(a.getLatLng())
        const pb = _map.latLngToContainerPoint(b.getLatLng())
        return pa.y - pb.y || pa.x - pb.x
      })

      const keptBoundingBoxes = []
      const keptSet = new Set()

      for (const marker of visibleMarkers) {
        const bb = getMarkerBoundingBox(marker)

        let collides = false
        for (const kept of keptBoundingBoxes) {
          if (boundingBoxesOverlap(bb, kept)) {
            collides = true
            break
          }
        }

        if (!collides) {
          keptBoundingBoxes.push(bb)
          keptSet.add(marker)
        }
      }

      for (const marker of postalCodeMarkers) {
        const el = marker.getElement()
        if (!el) continue

        if (!bounds.contains(marker.getLatLng())) {
          el.classList.add('hidden')
          continue
        }

        if (keptSet.has(marker)) el.classList.remove('hidden')
        else el.classList.add('hidden')
      }
    }

    _map.on('zoomend moveend', updatePostalCodeVisibility)
  }
})()

async function drawRoute(coords) {
  if (!_graph || !_edgeIndex) return

  const t0 = performance.now()

  clearRoute()

  const snap0 = findNearestEdgePointIndexed(_edgeIndex, coords[0])
  const useSnap0 = !!snap0
  let chosenNodeId0 = null

  if (useSnap0) {
    chosenNodeId0 = insertTempNodeOnEdge(_graph, snap0)
  } else {
    const nearest0 = findNearestNodeId(coords[0])
    chosenNodeId0 = nearest0.id
  }

  const snap1 = findNearestEdgePointIndexed(_edgeIndex, coords[1])
  const useSnap1 = !!snap1
  let chosenNodeId1 = null

  if (useSnap1) {
    chosenNodeId1 = insertTempNodeOnEdge(_graph, snap1)
  } else {
    const nearest1 = findNearestNodeId(coords[1])
    chosenNodeId1 = nearest1.id
  }

  if (_startMarker) _map.removeLayer(_startMarker)
  if (_endMarker) _map.removeLayer(_endMarker)

  // _startMarker = L.circleMarker(gameCoordToLatLng(coords[0]), {
  //   radius: 5,
  //   color: 'var(--color-accent-secondary)',
  //   fill: true,
  //   pane: 'navigation',
  // }).addTo(_map)

  _endMarker = L.circleMarker(gameCoordToLatLng(coords[1]), {
    radius: 5,
    color: 'var(--color-accent-secondary)',
    fill: true,
    pane: 'navigation',
    fillOpacity: 0.5,
  }).addTo(_map)

  const path = await astar(_graph, chosenNodeId0, chosenNodeId1)

  _activeRoutePath = path
  _activeRoutePathEdges = path ? getEdgesAlongPath(_graph, path) : null
  _activeRoutePathEdgePrefixMeters = _activeRoutePathEdges
    ? buildRouteEdgePrefixMeters(_activeRoutePathEdges)
    : null
  _activeRouteNodeEvents = path
    ? getRouteNodeEvents(_graph, _activeRoutePathEdges)
    : null

  if (path) {
    drawRouteFromPath(_graph, path)
  }

  const t1 = performance.now()
  // console.log('Route computed in ' + (t1 - t0).toFixed(2) + ' ms')
}

function clearRoute() {
  revertTempInsertions(_graph)

  _activeRoutePath = null
  _activeRoutePathEdges = null
  _activeRoutePathEdgePrefixMeters = null

  if (_startMarker) {
    _map.removeLayer(_startMarker)
    _startMarker = null
  }
  if (_endMarker) {
    _map.removeLayer(_endMarker)
    _endMarker = null
  }
  if (_routeLayer) {
    _map.removeLayer(_routeLayer)
    _routeLayer = null
  }
  _startNode = null
  _endNode = null

  _activeRouteNodeEvents = null
}

function gameCoordToLatLng(c) {
  return L.latLng(c[1], c[0])
}

function latLngToGameCoord(latlng) {
  return [latlng.lng, latlng.lat]
}

function euclid(a, b) {
  const dx = a[0] - b[0],
    dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

function polylineLength(coords) {
  let s = 0
  for (let i = 1; i < coords.length; i++) s += euclid(coords[i - 1], coords[i])
  return s
}

function getActiveRouteLengthMeters() {
  if (
    !_activeRoutePathEdges ||
    !Array.isArray(_activeRoutePathEdges) ||
    _activeRoutePathEdges.length === 0
  )
    return 0

  let total = 0
  for (const hop of _activeRoutePathEdges) {
    if (!hop || !hop.edge) continue
    const geom = hop.edge.geom
    if (Array.isArray(geom) && geom.length >= 2) total += polylineLength(geom)
    else if (typeof hop.edge.length === 'number') total += hop.edge.length
  }

  return total
}

function getHopLengthMeters(hop) {
  if (!hop || !hop.edge) return 0
  if (typeof hop.edge.length === 'number') return hop.edge.length
  const geom = hop.edge.geom
  if (Array.isArray(geom) && geom.length >= 2) return polylineLength(geom)
  return 0
}

function buildRouteEdgePrefixMeters(pathEdges) {
  if (!Array.isArray(pathEdges) || pathEdges.length === 0) return []
  const prefix = new Array(pathEdges.length)
  let total = 0
  for (let i = 0; i < pathEdges.length; i++) {
    total += getHopLengthMeters(pathEdges[i])
    prefix[i] = total
  }
  return prefix
}

function distanceAlongGeomMeters(geom, segIndex, t) {
  if (!Array.isArray(geom) || geom.length < 2) return 0
  const maxSeg = geom.length - 2
  const si = Math.max(0, Math.min(maxSeg, segIndex || 0))
  const tt = Math.max(0, Math.min(1, typeof t === 'number' ? t : 0))

  let dist = 0
  for (let i = 1; i <= si; i++) dist += euclid(geom[i - 1], geom[i])

  const a = geom[si]
  const b = geom[si + 1]
  dist += euclid(a, b) * tt
  return dist
}

function getActiveRouteProgressMeters(nearestOnRoute) {
  if (!nearestOnRoute || !_activeRoutePathEdges) return null

  const hopIndex = nearestOnRoute.hopIndex
  if (typeof hopIndex !== 'number' || hopIndex < 0) return null

  let prior = 0
  if (
    Array.isArray(_activeRoutePathEdgePrefixMeters) &&
    _activeRoutePathEdgePrefixMeters.length === _activeRoutePathEdges.length &&
    hopIndex > 0
  ) {
    prior = _activeRoutePathEdgePrefixMeters[hopIndex - 1] || 0
  } else {
    for (let i = 0; i < hopIndex; i++)
      prior += getHopLengthMeters(_activeRoutePathEdges[i])
  }

  const geom = nearestOnRoute.edge && nearestOnRoute.edge.geom
  const along = distanceAlongGeomMeters(
    geom,
    nearestOnRoute.segIndex,
    nearestOnRoute.t
  )
  return prior + along
}

function getDistanceFromStartToHopEndMeters(hopIndex) {
  if (!_activeRoutePathEdges || !_activeRoutePathEdges.length) return 0
  if (typeof hopIndex !== 'number' || hopIndex < 0) return 0
  const hi = Math.min(hopIndex, _activeRoutePathEdges.length - 1)

  if (
    Array.isArray(_activeRoutePathEdgePrefixMeters) &&
    _activeRoutePathEdgePrefixMeters.length === _activeRoutePathEdges.length
  ) {
    return _activeRoutePathEdgePrefixMeters[hi] || 0
  }

  let total = 0
  for (let i = 0; i <= hi; i++)
    total += getHopLengthMeters(_activeRoutePathEdges[i])
  return total
}

function getDistanceToNextRouteNodeEventMeters(nearestOnRoute, routeNodeEvent) {
  if (!routeNodeEvent) return 0

  const eventDistanceFromStart = getDistanceFromStartToHopEndMeters(
    routeNodeEvent.hopIndex
  )

  const progress = getActiveRouteProgressMeters(nearestOnRoute)
  if (progress === null) return eventDistanceFromStart

  return Math.max(0, eventDistanceFromStart - progress)
}

function getRemainingActiveRouteLengthMeters(nearestOnRoute) {
  const total =
    Array.isArray(_activeRoutePathEdgePrefixMeters) &&
    _activeRoutePathEdgePrefixMeters.length > 0
      ? _activeRoutePathEdgePrefixMeters[
          _activeRoutePathEdgePrefixMeters.length - 1
        ]
      : getActiveRouteLengthMeters()
  const progress = getActiveRouteProgressMeters(nearestOnRoute)
  if (progress === null) return total
  return Math.max(0, total - progress)
}

function mphToMetersPerSecond(mph) {
  return mph * 0.44704
}

function buildGraphFromGeoJSON(geojson, snapTolerance = 1.0) {
  const features = (geojson.features || []).filter(
    (f) => f.geometry && f.geometry.type === 'LineString'
  )
  const lines = features.map((f) =>
    turf.lineString(f.geometry.coordinates, f.properties || {})
  )

  const splitTargets = lines.map(() => [])
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const ints = turf.lineIntersect(lines[i], lines[j])
      if (ints.features.length) {
        ints.features.forEach((pt) => {
          splitTargets[i].push(pt)
          splitTargets[j].push(pt)
        })
      }
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const coords = lines[i].geometry.coordinates
    splitTargets[i].push(turf.point(coords[0]))
    splitTargets[i].push(turf.point(coords[coords.length - 1]))
  }

  const segments = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const pts = turf.featureCollection(splitTargets[i].map((p) => p))
    let res
    try {
      res =
        pts.features.length > 0
          ? turf.lineSplit(line, pts)
          : turf.featureCollection([line])
    } catch (e) {
      res = turf.featureCollection([line])
    }
    res.features.forEach((seg) => {
      if (
        seg.geometry &&
        seg.geometry.coordinates &&
        seg.geometry.coordinates.length >= 2
      ) {
        segments.push({
          coords: seg.geometry.coordinates,
          props: seg.properties || line.properties || {},
        })
      }
    })
  }

  function coordKey(coord) {
    return coord[0].toFixed(6) + '|' + coord[1].toFixed(6)
  }
  const nodesIndex = {}
  const nodes = {}
  let nextN = 1
  function findNearbyNode(coord) {
    for (const k in nodesIndex) {
      const id = nodesIndex[k]
      const n = nodes[id]
      const dx = n.x - coord[0],
        dy = n.y - coord[1]
      if (Math.sqrt(dx * dx + dy * dy) <= snapTolerance) return id
    }
    return null
  }
  function ensureNode(coord) {
    const key = coordKey(coord)
    if (nodesIndex[key]) return nodesIndex[key]
    const nearby = findNearbyNode(coord)
    if (nearby) return nearby
    const id = 'n' + nextN++
    nodesIndex[key] = id
    nodes[id] = { x: coord[0], y: coord[1] }
    return id
  }
  function isOneWay(props) {
    return props.oneway == true
  }

  const edges = {}
  let maxSpeedObserved = 0

  for (const seg of segments) {
    const coords = seg.coords
    const a = coords[0],
      b = coords[coords.length - 1]
    const fromId = ensureNode(a)
    const toId = ensureNode(b)
    if (fromId === toId) continue

    const length_m = polylineLength(coords)

    const speed_mps = mphToMetersPerSecond(seg.props.speed_limit)
    if (speed_mps > maxSpeedObserved) maxSpeedObserved = speed_mps

    const cost = length_m / speed_mps

    edges[fromId] = edges[fromId] || []
    edges[fromId].push({
      to: toId,
      length: length_m,
      cost,
      geom: coords,
      props: seg.props || {},
      speed_mps,
    })

    if (_ignoreOneWays || !isOneWay(seg.props)) {
      edges[toId] = edges[toId] || []
      edges[toId].push({
        to: fromId,
        length: length_m,
        cost,
        geom: coords.slice().reverse(),
        props: seg.props || {},
        speed_mps,
      })
    }
  }

  return { nodes, edges, maxSpeedMps: maxSpeedObserved }
}

function buildEdgeIndex(graph) {
  const grid = new Map()
  const meta = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    cellSize: EDGE_INDEX_CELL_SIZE,
  }

  function cellKey(ix, iy) {
    return ix + '_' + iy
  }
  function bboxToCells(minx, miny, maxx, maxy) {
    const ix0 = Math.floor(minx / meta.cellSize),
      iy0 = Math.floor(miny / meta.cellSize)
    const ix1 = Math.floor(maxx / meta.cellSize),
      iy1 = Math.floor(maxy / meta.cellSize)
    const res = []
    for (let ix = ix0; ix <= ix1; ix++)
      for (let iy = iy0; iy <= iy1; iy++) res.push(cellKey(ix, iy))
    return res
  }

  // iterate edges and add each segment as an entry
  for (const u in graph.edges) {
    if (!Object.prototype.hasOwnProperty.call(graph.edges, u)) continue
    const eds = graph.edges[u] || []
    for (const e of eds) {
      const geom = e.geom || []
      if (!geom || geom.length < 2) continue
      // for each segment in geometry
      for (let i = 1; i < geom.length; i++) {
        const a = geom[i - 1],
          b = geom[i]
        const minx = Math.min(a[0], b[0]),
          maxx = Math.max(a[0], b[0])
        const miny = Math.min(a[1], b[1]),
          maxy = Math.max(a[1], b[1])
        meta.minX = Math.min(meta.minX, minx)
        meta.minY = Math.min(meta.minY, miny)
        meta.maxX = Math.max(meta.maxX, maxx)
        meta.maxY = Math.max(meta.maxY, maxy)
        const cells = bboxToCells(
          minx - EDGE_SNAP_SEARCH_RADIUS,
          miny - EDGE_SNAP_SEARCH_RADIUS,
          maxx + EDGE_SNAP_SEARCH_RADIUS,
          maxy + EDGE_SNAP_SEARCH_RADIUS
        )
        const entry = {
          from: u,
          edge: e,
          segIndex: i - 1,
          a,
          b,
        }
        for (const ck of cells) {
          if (!grid.has(ck)) grid.set(ck, [])
          grid.get(ck).push(entry)
        }
      }
    }
  }

  return { grid, meta }
}

function revertTempInsertions(graph) {
  const st = _tempRouting
  if (!st) return
  for (const c of st.createdEdges || []) {
    const arr = graph.edges[c.from] || []
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === c.edge) arr.splice(i, 1)
    }
  }
  for (const r of st.removedEdges || []) {
    graph.edges[r.from] = graph.edges[r.from] || []
    graph.edges[r.from].push(r.edge)
  }
  for (const nid of st.createdNodes || []) {
    delete graph.nodes[nid]
    delete graph.edges[nid]
    for (const u in graph.edges) {
      graph.edges[u] = graph.edges[u].filter((e) => e.to !== nid)
    }
  }
  _tempRouting = null
}

function findNearestNodeId(coord) {
  let best = null,
    bestd = Infinity
  for (const id in _graph.nodes) {
    const n = _graph.nodes[id]
    const dx = n.x - coord[0],
      dy = n.y - coord[1]
    const d = Math.hypot(dx, dy)
    if (d < bestd) {
      best = id
      bestd = d
    }
  }
  return { id: best, distance: bestd }
}

function drawRouteFromPath(finalGraph, path) {
  if (!path || path.length < 2) return
  const routeCoords = []
  function coordsEqual(a, b, eps = 1e-6) {
    return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps
  }
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i],
      v = path[i + 1]
    const edgesFromU = finalGraph.edges[u] || []
    let edge = null
    let bestMetric = Infinity
    for (const ed of edgesFromU) {
      if (ed.to !== v) continue
      const metric =
        typeof ed.cost === 'number'
          ? ed.cost
          : typeof ed.length === 'number'
            ? ed.length
            : Infinity
      if (metric < bestMetric) {
        bestMetric = metric
        edge = ed
      }
    }
    if (!edge) {
      const A = finalGraph.nodes[u],
        B = finalGraph.nodes[v]
      if (routeCoords.length === 0) routeCoords.push([A.x, A.y], [B.x, B.y])
      else routeCoords.push([B.x, B.y])
      continue
    }
    let geom = edge.geom || []
    if (geom.length === 0) continue
    const uCoord = [finalGraph.nodes[u].x, finalGraph.nodes[u].y]
    if (!coordsEqual(geom[0], uCoord)) geom = geom.slice().reverse()
    if (routeCoords.length === 0) for (const p of geom) routeCoords.push(p)
    else for (let k = 1; k < geom.length; k++) routeCoords.push(geom[k])
  }
  if (_routeLayer) {
    _map.removeLayer(_routeLayer)
    _routeLayer = null
  }
  const latlngs = routeCoords.map((c) => gameCoordToLatLng(c))
  _routeLayer = L.polyline(latlngs, {
    color: 'var(--color-accent-secondary)',
    weight: 4,
    pane: 'navigation',
  }).addTo(_map)
  return routeCoords
}

function findNearestEdgePointIndexed(
  index,
  coord,
  maxSearch = EDGE_SNAP_SEARCH_RADIUS
) {
  if (!index || !index.grid) return null
  const cs = index.meta.cellSize
  const ix = Math.floor(coord[0] / cs),
    iy = Math.floor(coord[1] / cs)
  const radiusCells = Math.max(1, Math.ceil(maxSearch / cs))
  let best = { dist: Infinity, entry: null, point: null, t: 0 }
  function cellKey(ix, iy) {
    return ix + '_' + iy
  }
  const checked = new Set()
  for (let dx = -radiusCells; dx <= radiusCells; dx++) {
    for (let dy = -radiusCells; dy <= radiusCells; dy++) {
      const ck = cellKey(ix + dx, iy + dy)
      if (checked.has(ck)) continue
      checked.add(ck)
      const list = index.grid.get(ck)
      if (!list) continue
      for (const ent of list) {
        // Project onto this segment
        const res = projectPointOnSegment(ent.a, ent.b, coord)
        if (res.dist < best.dist) {
          best = { dist: res.dist, entry: ent, point: res.point, t: res.t }
        }
      }
    }
  }
  if (best.entry && best.dist <= maxSearch) {
    // return enriched result
    return {
      dist: best.dist,
      from: best.entry.from,
      to: best.entry.edge.to,
      edge: best.entry.edge,
      segIndex: best.entry.segIndex,
      point: best.point,
      t: best.t,
    }
  }
  return null
}

function projectPointOnSegment(a, b, p) {
  const ax = a[0],
    ay = a[1]
  const bx = b[0],
    by = b[1]
  const px = p[0],
    py = p[1]
  const vx = bx - ax,
    vy = by - ay
  const wx = px - ax,
    wy = py - ay
  const denom = vx * vx + vy * vy
  if (denom === 0) {
    return { point: [ax, ay], t: 0, dist: Math.hypot(px - ax, py - ay) }
  }
  let t = (vx * wx + vy * wy) / denom
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const cx = ax + t * vx,
    cy = ay + t * vy
  const dist = Math.hypot(px - cx, py - cy)
  return { point: [cx, cy], t, dist }
}

function insertTempNodeOnEdge(graph, snap) {
  const st = makeTempState()
  const edge = snap.edge
  const from = snap.from
  const to = snap.to
  const nid = 'tn' + st.nextId++
  const coord = snap.point
  graph.nodes[nid] = { x: coord[0], y: coord[1] }
  st.createdNodes.push(nid)

  // remove the original forward edge object from edges[from]
  const removedForward = removeEdgeObject(graph, from, edge)
  // try to remove reverse as well (if exists)
  const removedReverse = removeMatchingReverseEdge(graph, from, to, edge)

  // store removed edges so they can be restored later
  if (removedForward) st.removedEdges.push({ from, edge })
  if (removedReverse) st.removedEdges.push({ from: to, edge: removedReverse })

  // split geometry
  const geom = edge.geom || []
  const { left, right } = splitGeomAt(geom, snap.segIndex, snap.point)

  // compute lengths for halves
  const lenLeft = polylineLength(left)
  const lenRight = polylineLength(right)

  // reuse original props/speed
  const props = edge.props || {}
  const speed_mps = edge.speed_mps

  // create new edges: from -> nid, nid -> to
  const costLeft = lenLeft / speed_mps
  const costRight = lenRight / speed_mps
  const e1 = {
    to: nid,
    length: lenLeft,
    cost: costLeft,
    geom: left,
    props: props,
    speed_mps,
  }
  const e2 = {
    to: to,
    length: lenRight,
    cost: costRight,
    geom: right,
    props: props,
    speed_mps,
  }

  graph.edges[from] = graph.edges[from] || []
  graph.edges[from].push(e1)
  st.createdEdges.push({ from, edge: e1 })

  graph.edges[nid] = graph.edges[nid] || []
  graph.edges[nid].push(e2)
  st.createdEdges.push({ from: nid, edge: e2 })

  // handle reverse direction: only add reverse pieces if:
  //  - user configured _ignoreOneWays (treat all ways bidirectional), OR
  //  - we actually removed an existing reverse edge (i.e. original was bidirectional)
  const allowReverse = _ignoreOneWays || Boolean(removedReverse)

  if (allowReverse) {
    // reverse geometries
    const leftRev = left.slice().reverse()
    const rightRev = right.slice().reverse()
    const e1r = {
      to: from,
      length: lenLeft,
      cost: costLeft,
      geom: leftRev,
      props: props,
      speed_mps,
    }
    const e2r = {
      to: nid,
      length: lenRight,
      cost: costRight,
      geom: rightRev,
      props: props,
      speed_mps,
    }

    graph.edges[to] = graph.edges[to] || []
    graph.edges[to].push(e2r) // to -> nid (reverse of nid->to)
    st.createdEdges.push({ from: to, edge: e2r })

    graph.edges[nid].push(e1r) // nid -> from (reverse of from->nid)
    st.createdEdges.push({ from: nid, edge: e1r })
  }

  return nid
}

function makeTempState() {
  if (!_tempRouting)
    _tempRouting = {
      nextId: 1,
      createdNodes: [],
      removedEdges: [],
      createdEdges: [],
    }
  return _tempRouting
}

function removeEdgeObject(graph, from, edgeObj) {
  const arr = graph.edges[from] || []
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === edgeObj) {
      arr.splice(i, 1)
      return true
    }
  }
  return false
}

function removeMatchingReverseEdge(graph, from, to, edgeObj) {
  const arr = graph.edges[to] || []
  for (let i = 0; i < arr.length; i++) {
    const cand = arr[i]
    if (cand.to === from) {
      const lenEq = Math.abs((cand.length || 0) - (edgeObj.length || 0)) < 1e-6
      const geomEq =
        cand.geom && edgeObj.geom && cand.geom.length === edgeObj.geom.length
      if (lenEq && geomEq) {
        arr.splice(i, 1)
        return cand
      }
    }
  }
  return null
}

function splitGeomAt(geom, segIndex, point) {
  const left = []
  for (let i = 0; i <= segIndex; i++) left.push(geom[i])
  left.push(point.slice())
  const right = []
  right.push(point.slice())
  for (let i = segIndex + 1; i < geom.length; i++) right.push(geom[i])
  return { left, right }
}

async function astar(graph, startId, goalId) {
  const nodes = graph.nodes,
    edges = graph.edges
  if (!(startId in nodes) || !(goalId in nodes)) return null

  const config = await getConfig()
  const turnPenaltyPerRadian = config.mapTurnPenaltySecondsPerRadian
  const turnAngleIgnoreBelow = 0.087

  const maxSpeed = graph.maxSpeedMps
  function timeHeuristic(nA, nB) {
    const dx = nA.x - nB.x,
      dy = nA.y - nB.y
    const distMeters = Math.sqrt(dx * dx + dy * dy)
    return distMeters / maxSpeed
  }

  function stateKey(node, prev) {
    return node + '|' + (prev === null ? 'null' : prev)
  }
  const startKey = stateKey(startId, null)

  const open = [
    {
      key: startKey,
      node: startId,
      prev: null,
      g: 0,
      f: timeHeuristic(nodes[startId], nodes[goalId]),
      parent: null,
    },
  ]
  const gScore = {}
  gScore[startKey] = 0
  const parent = {}
  const closed = new Set()

  while (open.length) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()
    const curKey = current.key
    if (closed.has(curKey)) continue
    const curNode = current.node
    const curPrev = current.prev

    // reached goal
    if (curNode === goalId) {
      const path = []
      let k = curKey
      while (k) {
        const parts = k.split('|')
        const nid = parts[0]
        path.push(nid)
        k = parent[k]
      }
      path.reverse()
      return path
    }

    closed.add(curKey)

    const neighbors = edges[curNode] || []
    for (const e of neighbors) {
      const nbr = e.to
      let tentativeG = gScore[curKey] + e.cost

      // apply turn penalty (in seconds)
      if (curPrev !== null) {
        const pA = nodes[curPrev],
          pB = nodes[curNode],
          pC = nodes[nbr]
        const inVec = [pB.x - pA.x, pB.y - pA.y]
        const outVec = [pC.x - pB.x, pC.y - pB.y]
        const ang = angleBetween(inVec, outVec)
        if (ang > turnAngleIgnoreBelow) tentativeG += turnPenaltyPerRadian * ang
      }

      const nbrKey = stateKey(nbr, curNode)
      if (tentativeG < (gScore[nbrKey] || Infinity)) {
        gScore[nbrKey] = tentativeG
        parent[nbrKey] = curKey
        const f = tentativeG + timeHeuristic(nodes[nbr], nodes[goalId])
        open.push({
          key: nbrKey,
          node: nbr,
          prev: curNode,
          g: tentativeG,
          f,
          parent: curKey,
        })
      }
    }
  }

  return null
}

function angleBetween(a, b) {
  const ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1]
  const adot = ax * bx + ay * by
  const an = Math.hypot(ax, ay),
    bn = Math.hypot(bx, by)
  if (an === 0 || bn === 0) return Math.PI
  let cosv = adot / (an * bn)
  cosv = Math.max(-1, Math.min(1, cosv))
  return Math.acos(cosv)
}

function isCoordOnActiveRoute(coord, tolerance = 25) {
  if (!_routeLayer || !coord || coord.length < 2) return false

  let latlngs = _routeLayer.getLatLngs()
  if (!Array.isArray(latlngs) || latlngs.length < 2) return false

  const route = latlngs.map((ll) => latLngToGameCoord(ll))

  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    const { dist } = projectPointOnSegment(a, b, coord)
    if (dist <= tolerance) return true
  }

  return false
}

function getEdgesAlongPath(graph, path) {
  if (!graph || !graph.edges || !Array.isArray(path) || path.length < 2)
    return []

  const result = []

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]

    const edgesFrom = graph.edges[from] || []
    let bestEdge = null
    let bestMetric = Infinity

    for (const e of edgesFrom) {
      if (!e || e.to !== to) continue
      const metric =
        typeof e.cost === 'number'
          ? e.cost
          : typeof e.length === 'number'
            ? e.length
            : Infinity

      if (metric < bestMetric) {
        bestMetric = metric
        bestEdge = e
      }
    }

    result.push({ from, to, edge: bestEdge })
  }

  return result
}

function extractStreetNameFromProps(props) {
  if (!props) return null
  const v = props.name
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s ? s : null
}

function getRouteNodeEvents(graph, pathEdges, options = {}) {
  if (
    !graph ||
    !graph.nodes ||
    !Array.isArray(pathEdges) ||
    pathEdges.length < 2
  )
    return []

  const minTurnAngleRad =
    typeof options.minTurnAngleRad === 'number' ? options.minTurnAngleRad : 0.35

  const results = []

  function getStartTangentVec(geom, eps = 1e-6) {
    if (!Array.isArray(geom) || geom.length < 2) return null
    for (let i = 0; i < geom.length - 1; i++) {
      const a = geom[i]
      const b = geom[i + 1]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      if (Math.hypot(dx, dy) > eps) return [dx, dy]
    }
    return null
  }

  function getEndTangentVec(geom, eps = 1e-6) {
    if (!Array.isArray(geom) || geom.length < 2) return null
    for (let i = geom.length - 1; i >= 1; i--) {
      const a = geom[i - 1]
      const b = geom[i]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      if (Math.hypot(dx, dy) > eps) return [dx, dy]
    }
    return null
  }

  for (let i = 1; i < pathEdges.length; i++) {
    const incoming = pathEdges[i - 1]
    const outgoing = pathEdges[i]
    if (!incoming || !outgoing) continue

    const nodeId = incoming.to
    if (!nodeId || outgoing.from !== nodeId) continue
    if (!incoming.edge || !outgoing.edge) continue

    const node = graph.nodes[nodeId]
    if (!node) continue

    const coord = [node.x, node.y]
    const events = []

    const inStreet = extractStreetNameFromProps(incoming.edge.props)
    const outStreet = extractStreetNameFromProps(outgoing.edge.props)

    const inVec = getEndTangentVec(incoming.edge.geom)
    const outVec = getStartTangentVec(outgoing.edge.geom)
    if (inVec && outVec) {
      const inLen = Math.hypot(inVec[0], inVec[1])
      const outLen = Math.hypot(outVec[0], outVec[1])

      if (inLen > 0 && outLen > 0) {
        const dot = inVec[0] * outVec[0] + inVec[1] * outVec[1]
        let cosv = dot / (inLen * outLen)
        cosv = Math.max(-1, Math.min(1, cosv))
        const ang = Math.acos(cosv)

        const crossZ = inVec[0] * outVec[1] - inVec[1] * outVec[0]

        if (ang >= minTurnAngleRad) {
          events.push({
            type: crossZ > 0 ? 'turn-left' : 'turn-right',
            nodeId,
            coord,
            angleRad: ang,
            angleDeg: (ang * 180) / Math.PI,
            fromStreet: inStreet,
            toStreet: outStreet,
          })
        }
      }
    }
    if (inStreet !== outStreet && (inStreet || outStreet)) {
      events.push({
        type: 'street-change',
        nodeId,
        coord,
        fromStreet: inStreet,
        toStreet: outStreet,
      })
    }

    if (events.length > 0)
      results.push({ nodeId, coord, hopIndex: i - 1, events })
  }

  return results
}

function findNearestActiveRouteEdgePoint(
  coord,
  maxSearch = EDGE_SNAP_SEARCH_RADIUS
) {
  if (!coord || coord.length < 2) return null
  if (
    !_activeRoutePathEdges ||
    !Array.isArray(_activeRoutePathEdges) ||
    _activeRoutePathEdges.length === 0
  )
    return null

  let best = {
    dist: Infinity,
    hopIndex: -1,
    segIndex: -1,
    from: null,
    to: null,
    edge: null,
    point: null,
    t: 0,
  }

  for (let h = 0; h < _activeRoutePathEdges.length; h++) {
    const hop = _activeRoutePathEdges[h]
    if (!hop || !hop.edge) continue

    const geom = hop.edge.geom || []
    if (!Array.isArray(geom) || geom.length < 2) continue

    for (let i = 1; i < geom.length; i++) {
      const a = geom[i - 1]
      const b = geom[i]
      const res = projectPointOnSegment(a, b, coord)
      if (res.dist < best.dist) {
        best = {
          dist: res.dist,
          point: res.point,
          t: res.t,
          from: hop.from,
          to: hop.to,
          edge: hop.edge,
          hopIndex: h,
          segIndex: i - 1,
        }
      }
    }
  }

  if (best.edge && best.dist <= maxSearch) return best
  return null
}

async function displayRouteInstructions(eventType, distance, street) {
  const language = await getLanguage()
  let instructions = ''
  let direction = ''
  switch (eventType) {
    case 'turn-left':
      instructions = language.map.routeInstructions.turnLeft
      direction = topDoc.querySelector(
        '.iconAccess .directionArrowLeft'
      ).innerHTML
      break
    case 'turn-right':
      instructions = language.map.routeInstructions.turnRight
      direction = topDoc.querySelector(
        '.iconAccess .directionArrowRight'
      ).innerHTML
      break
    case 'street-change':
      instructions = language.map.routeInstructions.streetChange
      direction = topDoc.querySelector(
        '.iconAccess .directionArrowStraight'
      ).innerHTML
      break
    default:
      instructions = language.map.routeInstructions.arrive
      direction = topDoc.querySelector('.iconAccess .location').innerHTML
      break
  }

  instructions = instructions.replace(
    '{distance}',
    await getDistanceString(distance)
  )
  instructions = instructions.replace(
    '{street}',
    street || language.map.routeInstructions.defaultStreet
  )

  document.querySelector('.routeInstructionsControl .instructions').innerHTML =
    instructions

  document.querySelector('.routeInstructionsControl .direction').innerHTML =
    direction

  if (
    document
      .querySelector('.routeInstructionsControl')
      .classList.contains('hidden')
  ) {
    document
      .querySelector('.routeInstructionsControl')
      .classList.remove('hidden')
  }
}

async function getDistanceString(meters) {
  const language = await getLanguage()
  const config = await getConfig()
  if (config.mapUseBurgerUnits) {
    const miles = meters * 0.000621371
    if (miles < 0.1) {
      const feet = miles * 5280
      return feet.toFixed() + language.units.feet
    }
    return miles.toFixed(2) + language.units.miles
  }
  if (meters < 1000) {
    return meters.toFixed() + language.units.meters
  }
  const km = meters / 1000
  return km.toFixed(2) + language.units.kilometers
}
