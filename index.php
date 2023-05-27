<?php

require_once("../../config.php");
require_once("lib.php");
require_once("$CFG->libdir/rsslib.php");
require_once("$CFG->dirroot/course/lib.php");

$id = required_param('id', PARAM_INT);           // Course ID
$PAGE->set_url('/mod/htmleditor/index.php', array('id'=>$id));


$PAGE->set_context(\context_course::instance($id));
$PAGE->set_title("html editor page");

// Ensure that the course specified is valid
if (!$course = $DB->get_record('course', array('id'=> $id))) {
    throw new \moodle_exception('invalidcourseid');
}

//require_course_login($course);

$PAGE->set_pagelayout('incourse');

//$strhtmleditor = get_string("modulename", "htmleditor");
//$PAGE->navbar->add($strhtmleditor, "index.php?id=$course->id");

echo $OUTPUT->header();

echo "<h1>where?</h1>";

echo $OUTPUT->footer();

