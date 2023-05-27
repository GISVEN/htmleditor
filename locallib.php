<?php

function include_jsfile($file, $defer = true) {
    global $PAGE;
    $PAGE->requires->js( new moodle_url( '/mod/htmleditor/local/' . $file ), ! $defer );
}