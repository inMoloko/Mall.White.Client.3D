'use strict';

//TODO Не учитывается ситуация, когда на этаже кроме перехода нет сегментов

class GraphHelper {

    static dot(u, v) {
        return u.x * v.x + u.y * v.y;
    }

    static norm(v) {
        return Math.sqrt(this.dot(v, v));
    }

    static distance(u, v) {
        return this.norm({x: u.x - v.x, y: u.y - v.y});
    }

    static vector(point1, point2) {
        return {x: point1.x - point2.x, y: point1.y - point2.y};
    }

    static closestSegmentPoint(point, segmentPoint0, segmentPoint1) {
        var v = this.vector(segmentPoint1, segmentPoint0);
        var w = this.vector(point, segmentPoint0);

        var c1 = this.dot(w, v);
        if (c1 <= 0)
            return segmentPoint0;

        var c2 = this.dot(v, v);
        if (c2 <= c1)
            return segmentPoint1;

        var b = c1 / c2;
        return {x: b * v.x + segmentPoint0.x, y: b * v.y + segmentPoint0.y};
    }
}

class Vertex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dksLength = Number.MAX_VALUE;
        this.dksIsVisited = false;
        this.dksPreviousVertex = null;
        this.segments = [];
        this.layer = null;
    }


    clearDksData() {
        this.dksLength = Number.MAX_VALUE;
        this.dksIsVisited = false;
        this.dksPreviousVertex = null;
    }

    addSegment(segment) {
        if (!this.segments.includes(segment))
            this.segments.push(segment);
    }

    removeSegment(segment) {
        var index = this.segments.indexOf(segment);
        if (index > -1) {
            this.segments.splice(index, 1);
        }
    }
}

class Segment {
    constructor(vertex0, vertex1) {
        this.vertex0 = vertex0;
        this.vertex1 = vertex1;
        this.layer = null;

        this._length = null;
    }

    get length() {
        if (this._length != null)
            return this._length;
        else if (this.vertex0.layer != this.vertex1.layer)
            return this._length = 1000;
        else
            return this._length = GraphHelper.distance(this.vertex0, this.vertex1);
    }
}


class Layer {
    constructor(layerID) {
        this.vertexes = [];
        this.segments = [];
        this.layerID = layerID;
    }

    addVertex(x, y) {
        var vertex = this.getVertex(x, y);
        if (vertex)
            return vertex;

        vertex = new Vertex(x, y);
        this.vertexes.push(vertex);
        vertex.layer = this;
        return vertex;
    }

    addVertexWithShortestSegment(x, y) {
        var vertex = this.getVertex(x, y);
        //считаем, что вершин без сегментов быть не может. Если вершина в графе, то к ней есть путь.
        if (vertex != null)
            return null;

        var point = {x: x, y: y};
        var nearestGraphPoint = {x: 0, y: 0};
        var minDistanceToGraph = Number.MAX_VALUE;
        var nearestSegment = null;


        this.segments.forEach(function (segment, i, arr) {
            if (segment.vertex0.layer === segment.vertex1.layer) {
                var closestPoint = GraphHelper.closestSegmentPoint(point, segment.vertex0, segment.vertex1);
                var dist = GraphHelper.distance(closestPoint, point);

                if (minDistanceToGraph > dist) {
                    nearestGraphPoint = closestPoint;
                    minDistanceToGraph = dist;
                    nearestSegment = segment;
                }
            }
        });

        var result = {addedVertexes: [], addedSegments: [], removedSegments: [], vertex: null};

        if (nearestSegment == null)
            return result;

        var isNearestVertexExists = this.getVertex(nearestGraphPoint.x, nearestGraphPoint.y) != null;
        vertex = this.addVertex(x, y);
        result.vertex = vertex;
        var nearestVertex = this.addVertex(nearestGraphPoint.x, nearestGraphPoint.y);
        var segmentToNearestVertex = this.addSegment1(vertex, nearestVertex);

        result.addedVertexes.push(vertex);
        result.addedSegments.push(segmentToNearestVertex);


        //Если ближайшая точка на сегменте, то разбиваем его на два и удаляем исходный сегмент
        if (!isNearestVertexExists) {
            var nearestVertexSegment1 = this.addSegment1(nearestVertex, nearestSegment.vertex0);
            var nearestVertexSegment2 = this.addSegment1(nearestVertex, nearestSegment.vertex1);
            this.removeSegment(nearestSegment);

            result.addedVertexes.push(nearestVertex);
            result.addedSegments.push(nearestVertexSegment1);
            result.addedSegments.push(nearestVertexSegment2);
            result.removedSegments.push(nearestSegment);
        }

        return result;
    }

    removeSegment(segment) {

        var index = this.segments.indexOf(segment);
        if (index > -1) {
            this.segments.splice(index, 1);
        }

        segment.vertex0.removeSegment(segment);
        segment.vertex1.removeSegment(segment);
        //this.vertexes.forEach(function(vertex, i, arr){
        //  if (vertex === segment.vertex0 || vertex === segment.vertex1)
        //    vertex.removeSegment(segment);
        //});
    }


    addSegment(x, y, x1, y1) {
        var vertex0 = this.addVertex(x, y);
        var vertex1 = this.addVertex(x1, y1);
        var segment = new Segment(vertex0, vertex1);
        //дубли не проверяем
        this.segments.push(segment);
        segment.layer = this;
        vertex0.addSegment(segment);
        vertex1.addSegment(segment);
        return segment;
    }

    addSegment1(vertex0, vertex1) {
        var segment = new Segment(vertex0, vertex1);
        this.segments.push(segment);
        segment.layer = this;
        vertex0.addSegment(segment);
        vertex1.addSegment(segment);
        return segment;
    }

    addSegment2(segment) {
        this.segments.push(segment);
        segment.layer = this;
        segment.vertex0.addSegment(segment);
        segment.vertex1.addSegment(segment);
        return segment;
    }

    getVertex(x, y) {
        var vertex = this.vertexes.find(function (vertex) {
            return vertex.x === x && vertex.y === y;
        });
        return vertex;
    }


    removeVertex(vertex) {
        var self = this;
        vertex.segments.forEach(function (segment, i, arr) {
            self.removeSegment(segment);
        });
        var index = this.vertexes.indexOf(vertex);
        if (index > -1) {
            this.vertexes.splice(index, 1);
        }
    }

    clearDksData() {
        this.vertexes.forEach(function (item, i, arr) {
            item.clearDksData();
        });
    }
}


class Graph {
    constructor() {
        this.layers = [];
        this.startVertex = null;

    }

    addLayer(layerID) {
        var layer = new Layer(layerID);
        this.layers.push(layer);
        return layer;
    }

    getLayer(layerID) {
        return this.layers.find(function (layer) {
            return layer.layerID === layerID;
        });
    }

    clearDksData() {
        this.layers.forEach(function (item, i, arr) {
            item.clearDksData();
        });
    }

    findPath(startVertexX, startVertexY, startVertexLayerID, destVertexX, destVertexY, destVertexLayerID) {
        try {

            this.clearDksData();

            var startVertex = this.getLayer(startVertexLayerID).getVertex(startVertexX, startVertexY);
            if (startVertex == undefined)
                throw `Стартовая точка не найденна startVertexLayerID: ${startVertexLayerID}, startVertexX: ${startVertexX}, startVertexY: ${startVertexY}`;
            startVertex.dksLength = 0;

            var destVertexLayer = this.getLayer(destVertexLayerID);
            var addDestVertexWithShortestSegmentResult = destVertexLayer.addVertexWithShortestSegment(destVertexX, destVertexY);


            var unvisitedVertexes = [];
            this.layers.forEach(function (item, i, arr) {
                unvisitedVertexes = unvisitedVertexes.concat(item.vertexes);
            });

            while (true) {
                if (unvisitedVertexes.length === 0)
                    break;

                var currentVertex = unvisitedVertexes.sort((vertex0, vertex1) => vertex0.dksLength > vertex1.dksLength ? 1 : vertex0.dksLength == vertex1.dksLength ? 0 : -1).shift();
                currentVertex.dksIsVisited = true;

                if (currentVertex.dksLength === Number.MAX_VALUE)
                    break;

                currentVertex.segments.forEach(function (segment, i, arr) {
                    var secondVertex = segment.vertex0 === currentVertex ? segment.vertex1 : segment.vertex0;
                    if (!secondVertex.dksIsVisited) {
                        if (secondVertex.dksLength > currentVertex.dksLength + segment.length) {
                            secondVertex.dksLength = currentVertex.dksLength + segment.length;
                            secondVertex.dksPreviousVertex = currentVertex;
                        }
                    }
                });
            }

            var destVertex = destVertexLayer.getVertex(destVertexX, destVertexY);
            if (destVertex.dksIsVisited) {
                var vertex = destVertex;
                var paths = [];
                while (vertex != startVertex) {
                    paths.unshift(vertex);
                    vertex = vertex.dksPreviousVertex;
                }
                paths.unshift(vertex);
                return paths;
            }
            else
                return null;
        }
        finally {
            if (addDestVertexWithShortestSegmentResult) {
                addDestVertexWithShortestSegmentResult.addedVertexes.forEach(function (item, i, arr) {
                    item.layer.removeVertex(item);
                });

                addDestVertexWithShortestSegmentResult.addedSegments.forEach(function (item, i, arr) {
                    item.layer.removeSegment(item);
                });

                addDestVertexWithShortestSegmentResult.removedSegments.forEach(function (item, i, arr) {
                    item.layer.addSegment2(item);
                });
            }
        }
    }
}