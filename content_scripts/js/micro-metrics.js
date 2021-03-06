var authorId = "tu_nombre";
var volunteer = "numero_de_voluntario";
var capturerServerURL = "http://localhost:1701/micrometrics/metrics/";
var widgets = {};

function getWidgetMicroMetrics(anElement) {
    metricId = anElement.getAttribute("data-metric-id");
    if (!metricId) {
        anElement.setAttribute("data-metric-id",getRandomID());
        metricId = anElement.getAttribute("data-metric-id");
    }
    if (!widgets[metricId]) {
        widgets[metricId] = {"id": metricId, "url": window.location.href, "authorId": authorId, "volunteer": volunteer, "interactions": 0};
        if (anElement.tagName.toLowerCase() == "input") {
            widgets[metricId] = Object.assign({}, widgets[metricId], {"widgetType": "TextInput", "typingLatency": 0, "typingSpeed": 0,
                "typingVariance": null,"totalTypingTime": 0, "correctionAmount": 0, "mouseTraceLength": 0, "typingIntervals": []});
        }
        else {
            widgets[metricId] = Object.assign({}, widgets[metricId], {"widgetType": "SelectInput", "clicks": 0, "keystrokes": 0,
                "optionsSelected": 0,"focusTime": 0, "optionsDisplayTime": 0, "mouseTraceLength": 0});
        }
    }
    return widgets[metricId];
}

function logMetrics(metrics) {
    metrics["timestamp"] = new Date().getTime();
    console.log(metrics);
    metrics["sent"] = false;
    metrics["interactions"] += 1;
    $("title").text(metrics.id);
}

    var focusTime;
    var typingLatency;
    var typingSpeed;
    var charsTyped = 0;
    var alreadyTyped = false;
    var typingIntervals = [];
    var lastKeypressTimestamp = 0;
    var charsDeleted = 0;

    var startingTop,startingLeft;
    var lastTop,lastLeft;
    var mouseTraceLength = 0;
    var currentWidget,currentWidgetCenter,lastWidget;
    var mouseBlur = null;

    $(document).mousemove(function(e) {
      if (typeof(currentWidget) != "undefined") {
        if (currentWidget != lastWidget) {
          var centerX = getOffset(currentWidget).left + (currentWidget.offsetWidth / 2);
          var centerY = getOffset(currentWidget).top + (currentWidget.offsetHeight / 2);
          currentWidgetCenter = {x:centerX, y:centerY};
          startingTop = e.pageY;
          startingLeft = e.pageX;
          lastTop = e.pageY;
          lastLeft = e.pageX;
          mouseTraceLength = 0;
          lastWidget = currentWidget;
        }

        var delta = Math.round(
                        Math.sqrt(
                          Math.pow(lastTop - e.pageY, 2) +
                          Math.pow(lastLeft - e.pageX, 2)
                        )
                      );

        lastTop = e.pageY;
        lastLeft = e.pageX;

        if (withinRectangle({x:e.pageX, y:e.pageY}, getWidgetSurroundings(currentWidget))){
          mouseTraceLength += delta;
          mouseBlur = null;
        }
        else{
          mouseBlur = e.timeStamp;
        }
      }
    });

    function withinRectangle(point, rectangle){
      return (
                (point.x > rectangle.topLeft.x) && (point.x < rectangle.bottomRight.x) &&
                (point.y > rectangle.topLeft.y) && (point.y < rectangle.bottomRight.y)

              )
    }

    function getOffset(el) {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
      };
    }

    function getWidgetSurroundings(el) {
      margin = 40;
      const rect = el.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const top = rect.top + window.scrollY;
      const right = rect.right + window.scrollX;
      const bottom = rect.bottom + window.scrollY;
      return {
        topLeft: {x:left - margin, y:top - margin},
        bottomRight: {x:right + margin, y:bottom + margin}
      };
    }

    $("input").on('focus blur keypress keydown keyup', function (e) {
        switch (e.type) {
            case "focus":
                focusTime = e.timeStamp;
                currentWidget = e.target;
                //console.log('Last Widget: Distance > ' + distance +'    Total Trace > '+mouseTraceLength);
            case "keydown":
                if (e.keyCode === 8) {
                    getWidgetMicroMetrics(e.target).correctionAmount++;
                }
                break;
            case "keypress":
                // keypress is fired with printable characters
                if (!alreadyTyped) {
                    typingLatency = e.timeStamp - focusTime;
                    alreadyTyped = true;
                }
                charsTyped++;
                if (lastKeypressTimestamp != 0) {
                    var switchingTime = e.timeStamp;
                    var intraKeypressInterval = switchingTime - lastKeypressTimestamp;
                    getWidgetMicroMetrics(e.target).typingIntervals.push(intraKeypressInterval);
                }
                lastKeypressTimestamp = e.timeStamp;
                break;
            case "blur":
                if (charsTyped) {
                    if (mouseBlur != null) {
                      lastFocusTime = mouseBlur;
                      mouseBlur = null;
                      console.log("Using MOUSE blur at: "+lastFocusTime);
                    }
                    else {
                      lastFocusTime = e.timeStamp;
                      console.log("Using REAL blur at: "+lastFocusTime);
                    }
                    totalTypingTime = lastFocusTime - (focusTime + typingLatency);
                    getWidgetMicroMetrics(e.target).totalTypingTime += totalTypingTime;
                    getWidgetMicroMetrics(e.target).typingSpeed += totalTypingTime / charsTyped;
                    getWidgetMicroMetrics(e.target).typingVariance = calculateVariance(getWidgetMicroMetrics(e.target).typingIntervals);
                }
                else {
                    typingLatency = e.timeStamp - focusTime;
                }
                getWidgetMicroMetrics(e.target).typingLatency += typingLatency;
                getWidgetMicroMetrics(e.target).mouseTraceLength += mouseTraceLength;
                logMetrics(getWidgetMicroMetrics(e.target));
                charsTyped = 0;
                alreadyTyped = false;
                typingIntervals = [];
                lastKeypressTimestamp = 0;
                charsDeleted = 0;
                typingLatency = null;
                break;
            default:
            null
        }
    });

function calculateVariance(intervals) {
    if (intervals.length == 0) {
        return null;
    }
    var total = 0;
    var total_power_of_two = 0;
    $.each(intervals, function (i, interval) {
        total += interval;
        total_power_of_two += Math.pow(interval, 2);
    });
    var media = total / intervals.length;
    var variance = (total_power_of_two / intervals.length) - Math.pow(media, 2);
    return Math.pow(variance, 1 / 2); // standard deviation

}

function getRandomID () {
    return  Math.random().toString(36).substring(2, 15);
}

function SelectMetrics() {
    var focusTime;
    var openTime;
    var optionsDisplayTime = 0;

    $("select").on("focus", function (e) {
        focusTime = e.timeStamp;
        currentWidget = e.target;
    });

    // triggered only when options box is opened
    $("select").on("mousedown", function (e) {
        openTime = e.timeStamp;
        getWidgetMicroMetrics(e.target).clicks++;
    });


    $("select").on("change", function (e) {
        getWidgetMicroMetrics(e.target).optionsSelected++;
        if (openTime) {
            getWidgetMicroMetrics(e.target).optionsDisplayTime += e.timeStamp - openTime;
        }
    });

    // only triggered when options box is closed
    $("select").on("keypress", function () {
        getWidgetMicroMetrics(e.target).keystrokes++;
    });

    $("select").on("blur", function (e) {
        var now = e.timeStamp;
        getWidgetMicroMetrics(e.target).focusTime += now - focusTime;
        getWidgetMicroMetrics(e.target).mouseTraceLength += mouseTraceLength;
        logMetrics(getWidgetMicroMetrics(e.target));
    });
}

SelectMetrics();

window.onblur = function() {
    Object.keys(widgets).forEach(function(key) {
        if (!widgets[key].sent) {
            $.post(capturerServerURL, widgets[key]);
            widgets[key].sent = true;
        }
    });
};
