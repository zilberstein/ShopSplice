(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/geojson-utils/geojson-utils.tests.js                                                    //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
var gju = GeoJSON;                                                                                  // 1
                                                                                                    // 2
Tinytest.add("geojson-utils - line intersects", function (test) {                                   // 3
  var diagonalUp = { "type": "LineString","coordinates": [                                          // 4
    [0, 0], [10, 10]                                                                                // 5
  ]}                                                                                                // 6
  var diagonalDown = { "type": "LineString","coordinates": [                                        // 7
    [10, 0], [0, 10]                                                                                // 8
  ]}                                                                                                // 9
  var farAway = { "type": "LineString","coordinates": [                                             // 10
    [100, 100], [110, 110]                                                                          // 11
  ]}                                                                                                // 12
                                                                                                    // 13
  test.isTrue(gju.lineStringsIntersect(diagonalUp, diagonalDown));                                  // 14
  test.isFalse(gju.lineStringsIntersect(diagonalUp, farAway));                                      // 15
});                                                                                                 // 16
                                                                                                    // 17
// Used by two tests                                                                                // 18
var box = {                                                                                         // 19
  "type": "Polygon",                                                                                // 20
  "coordinates": [                                                                                  // 21
    [ [0, 0], [10, 0], [10, 10], [0, 10] ]                                                          // 22
  ]                                                                                                 // 23
};                                                                                                  // 24
                                                                                                    // 25
Tinytest.add("geojson-utils - inside/outside of the box", function (test) {                         // 26
                                                                                                    // 27
  var inBox = {"type": "Point", "coordinates": [5, 5]}                                              // 28
  var outBox = {"type": "Point", "coordinates": [15, 15]}                                           // 29
                                                                                                    // 30
  test.isTrue(gju.pointInPolygon(inBox, box));                                                      // 31
  test.isFalse(gju.pointInPolygon(outBox, box));                                                    // 32
});                                                                                                 // 33
                                                                                                    // 34
Tinytest.add("geojson-utils - drawCircle", function (test) {                                        // 35
  test.length(gju.drawCircle(10, {"type": "Point", "coordinates": [0, 0]}).                         // 36
               coordinates[0], 15);                                                                 // 37
  test.length(gju.drawCircle(10, {"type": "Point", "coordinates": [0, 0]}, 50).                     // 38
              coordinates[0], 50);                                                                  // 39
});                                                                                                 // 40
                                                                                                    // 41
Tinytest.add("geojson-utils - centroid", function (test) {                                          // 42
  var centroid = gju.rectangleCentroid(box)                                                         // 43
  test.equal(centroid.coordinates[0], 5);                                                           // 44
  test.equal(centroid.coordinates[1], 5);                                                           // 45
});                                                                                                 // 46
                                                                                                    // 47
Tinytest.add("geojson-utils - point distance", function (test) {                                    // 48
  var fairyLand = {"type": "Point",                                                                 // 49
    "coordinates": [-122.260000705719, 37.80919060818706]}                                          // 50
  var navalBase = {"type": "Point",                                                                 // 51
    "coordinates": [-122.32083320617676, 37.78774223089045]}                                        // 52
  test.equal(Math.floor(gju.pointDistance(fairyLand, navalBase)), 5852);                            // 53
});                                                                                                 // 54
                                                                                                    // 55
Tinytest.add("geojson-utils - points distance generated tests", function (test) {                   // 56
  var floatEqual = function (a, b) {                                                                // 57
    test.isTrue(Math.abs(a - b) < 0.000001);                                                        // 58
  };                                                                                                // 59
                                                                                                    // 60
  // Pairs of points we will be looking a distance between                                          // 61
  var tests = [[[-19.416501816827804,-13.442164216190577], [8.694866622798145,-8.511979941977188]], // 62
    [[151.2841189110186,-56.14564002258703], [167.77983197313733,0.05544793023727834]],             // 63
    [[100.28413630579598,-88.02313695591874], [36.48786173714325,53.44207073468715]],               // 64
    [[-70.34899035631679,76.51596869179048], [154.91605914011598,-73.60970971290953]],              // 65
    [[96.28682994353585,58.77288202662021], [-118.33936230326071,72.07877089688554]],               // 66
    [[140.35530551429838,10.507104953983799], [-67.73368513956666,38.075836981181055]],             // 67
    [[69.55582775664516,86.25450283149257], [-18.446230484172702,6.116170521359891]],               // 68
    [[163.83647522330284,-65.7211532376241], [-159.2198902608361,-78.42975475382991]],              // 69
    [[-178.9383797585033,-54.87420454365201], [-175.35227065649815,-84.04084282391705]],            // 70
    [[-48.63219943456352,11.284161149058491], [-179.12627786491066,-51.95622375886887]],            // 71
    [[140.29684206470847,-67.20720696030185], [-109.37452355003916,36.03131077555008]],             // 72
    [[-154.6698773431126,58.322094617411494], [61.18583445576951,-4.3424885796848685]],             // 73
    [[122.5562841903884,10.43972848681733], [-11.756078708684072,-43.86124441982247]],              // 74
    [[-67.91648306301795,-86.38826347864233], [163.577536230674,12.987319261068478]],               // 75
    [[91.65140007715672,17.595150742679834], [135.80393003183417,22.307532118167728]],              // 76
    [[-112.70280818711035,34.45729674655013], [-127.42168210959062,-25.51327457977459]],            // 77
    [[-161.55807900894433,-77.40711871231906], [-92.66313794790767,-89.12077954714186]],            // 78
    [[39.966264681424946,9.890176948625594], [-159.88646019320004,40.60383598925546]],              // 79
    [[-57.48232689569704,86.64061016729102], [59.53941993578337,-75.73194969259202]],               // 80
    [[-142.0938081513159,80.76813141163439], [14.891517050098628,64.56322408467531]]];              // 81
                                                                                                    // 82
  // correct distance between two points                                                            // 83
  var answers = [3115066.2536578891, 6423493.2321747802, 15848950.0402601473,                       // 84
    18714226.5425080135, 5223022.7731127860, 13874476.3135112207,                                   // 85
    9314403.3309389465, 1831929.5917785936, 3244710.9344544266,                                     // 86
    13691492.4666933995, 14525055.6462231465, 13261602.4336371962,                                  // 87
    14275427.5511620939, 11699799.3615680672, 4628773.1129429890,                                   // 88
    6846704.0253010122, 1368055.9401701286, 14041503.0409814864,                                    // 89
    18560499.7346975356, 3793112.6186894816];                                                       // 90
                                                                                                    // 91
  _.each(tests, function (pair, testN) {                                                            // 92
    var distance = GeoJSON.pointDistance.apply(this, _.map(pair, toGeoJSONPoint));                  // 93
    test.isTrue(Math.abs(distance - answers[testN]) < 0.00000001,                                   // 94
      "Wrong distance between points " + JSON.stringify(pair) + ": " + distance);                   // 95
  });                                                                                               // 96
                                                                                                    // 97
  function toGeoJSONPoint (coordinates) {                                                           // 98
    return { type: "Point", coordinates: coordinates };                                             // 99
  }                                                                                                 // 100
});                                                                                                 // 101
                                                                                                    // 102
                                                                                                    // 103
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
