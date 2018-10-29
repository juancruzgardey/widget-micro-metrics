var capturerServerURL = "http://localhost:1701/metrics/";
var focusTime;
var typingLatency;
var typingSpeed;
var charsTyped = 0;
var alreadyTyped = false;
var typingIntervals = [];
var lastKeypressTimestamp = 0;
var charsDeleted = 0;

$("body").prepend("<div id='snackbar'></div>");

$("input").on('focus blur keypress keydown keyup', function (e) {
    switch (e.type) {
        case "focus":
            focusTime = e.timeStamp;
        case "keydown":
            if (e.keyCode === 8) {
                charsDeleted++;
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
                typingIntervals.push(intraKeypressInterval);
            }
            lastKeypressTimestamp = e.timeStamp;
            break;
        case "blur":
            totalTypingTime = e.timeStamp - (focusTime + typingLatency);
            typingSpeed = totalTypingTime / charsTyped;

            // if typingLatency is undefined the others metrics are undefined too
            if (typingLatency) {
                metrics = {
                    "id": getRandomID(),
                    "timestamp": new Date().getTime(),
                    "typingLatency": typingLatency,
                    "totalTypingTime": totalTypingTime,
                    "typingSpeed": typingSpeed,
                    "typingVariance": calculateVariance(typingIntervals),
                    "typingIntervals": typingIntervals,
                    "correctionAmount": charsDeleted
                };
                $.post( capturerServerURL, metrics );
                console.log(metrics);
                metrics_string = "<strong>id: </strong>" + metrics.id + "<br><strong>timestamp: </strong>" + metrics.timestamp + "<br><strong>typingLatency: </strong>" + metrics.typingLatency
                    + "<br><strong>totalTypingTime: </strong>" + metrics.totalTypingTime
                    + "<br><strong>typingSpeed: </strong>" + metrics.typingSpeed + "<br><strong>typingVariance: </strong>" + metrics.typingVariance +
                    "<br><strong>correctionAmount: </strong>" + metrics.correctionAmount;
                showSnackBar(metrics_string);
            }
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
    var total = 0;
    var total_power_of_two = 0;
    $.each(intervals, function (i, interval) {
        total += interval;
        total_power_of_two += Math.pow(interval, 2);
    });
    var media = total / typingIntervals.length;
    var variance = (total_power_of_two / typingIntervals.length) - Math.pow(media, 2);
    return Math.pow(variance, 1 / 2); // standard deviation

}

function getRandomID () {
    return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function showSnackBar(aMessage) {
    var snackbar = $("#snackbar")[0];
    $(snackbar).html(aMessage);
    snackbar.className = "show";
    setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}


//SelectMetrics();


function SelectMetrics() {
    var clicks = 0;
    var keystrokes = 0;
    var optionsSelected = 0;
    var focusTime;
    var openTime;

    $("select").on("focus", function (e) {
        focusTime = e.timeStamp;
    });

    // triggered when options box is opened
    $("select").on("mousedown", function () {
        openTime = e.timeStamp;
        clicks++;
        console.log("clicks " + clicks);
    });

    // only triggered when options is closed
    $("select").on("keypress", function () {
        console.log("keypress");
        keystrokes++;
    });


    $("select").on("change", function () {

        optionsSelected++;
    });

    $("select").on("blur", function (e) {
        var now = e.timeStamp;
        console.log({"clicks": clicks, "keystrokes": keystrokes, "optionsSelected": optionsSelected,
            "focusTime": now - focusTime});
        clicks = 0;
        keystrokes = 0;
        optionsSelected = 0;
        focusTime = now;
    });


}
