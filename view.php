<?php

use mod_htmleditor\output\standard_action_bar;

require_once("../../config.php");
require_once($CFG->libdir . '/completionlib.php');
require_once("$CFG->libdir/rsslib.php");
require_once("./locallib.php");

global $PAGE;
global $USER;

echo "<style>.notifytiny.debuggingmessage{
display: none;
}</style>";

// $CFG->cachejs = false;
$CFG->debug = 32767;  
$CFG->debugdisplay = true;

$id   = optional_param("id", 0, PARAM_INT);
$name = optional_param("name", "default", PARAM_TEXT);
$placeholde = optional_param('placeholder', "placeholder", PARAM_TEXT);

if (!empty($id)) {
    if (! $cm = get_coursemodule_from_id('htmleditor', $id)) {
        throw new \moodle_exception('invalidcoursemodule');
    }
    if (! $course = $DB->get_record("course", array("id"=>$cm->course))) {
        throw new \moodle_exception('coursemisconf');
    }
    if (! $htmleditor = $DB->get_record("htmleditor", array("id"=>$cm->instance))) {
        throw new \moodle_exception('invalidid', 'htmleditor');
    }
}


$cm = cm_info::create($cm);
require_course_login($course, true, $cm);

echo $OUTPUT->header();

$context = context_module::instance($cm->id);


$PAGE->requires->js( new moodle_url( "/mod/htmleditor/local/ace-builds-master/src/ace.js"));
$PAGE->requires->js( new moodle_url( "/mod/htmleditor/local/AcePlayground.js"));

// echo "<script src='./local/ace-builds-master/src/ace.js'></script>";
// echo "<script src='./local/AcePlayground.js'></script>";


echo "
<style>
footer {
    display: none;
}



#topofscroll {
    overflow: visible;
}
#page.drawers .main-inner {
    margin-bottom: 21rem;
}
.activity-header{
    display: none;
}
.modal {
  display: none;
  position: fixed;
  z-index: 10;
  padding-top: 100px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  height: 80%;
}

.close {
  color: #aaaaaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}

</style>";

function getRulesWithChilds($rule_id) {
    global $DB;
    $rule = $DB->get_record('htmleditor_rules', ['id'=>$rule_id]);
    $rule_child_id = $rule->child_id;
    $result = [
        'rule' => $rule,
        'childs' => null
    ];
    if ($rule_child_id != '' and $rule_child_id != null) {
        $rule_child_id_array = explode(' ', $rule_child_id);
        foreach ($rule_child_id_array as $child_id) {
            $result['childs'][] = getRulesWithChilds($child_id);
        }
    }

    return $result;
}

function getRules($task_id): string {
    global $DB;
    $task_instance = $DB->get_record('htmleditor', ['id'=>$task_id]);
    $rules_with_childs = [];
    $rules = $task_instance->rules;

    if ($rules != '' and $rules != null) {
        $rules_array = explode(' ', $rules);
        foreach ($rules_array as $rule) {
            $rules_with_childs[] = getRulesWithChilds($rule);
        }
    }


    return json_encode($rules_with_childs);
}

echo '<div id="myModal" class="modal">
  <div class="modal-content">
    <span class="close" onclick="closeModal()">&times;</span>
    <h2>Задание успешно выполнено! Теперь вы можете отметить выполнение задания</h2>
  </div>
</div>';

$rules_json = getRules($htmleditor->id);
$rules_json = str_replace("'", "&#39", $rules_json);
$placeholder_replaced = str_replace("'", "&#39", $htmleditor->placeholder);
//var_dump($rules_json);


$PAGE->requires->js_call_amd("init");

echo "<ace-playground html='{$placeholder_replaced}' rules='{$rules_json}'></ace-playground>";

//$completiondetails = \core_completion\cm_completion_details::get_instance($cm, $USER->id);
//$activitydates = \core\activity_dates::get_dates_for_module($cm, $USER->id); // Fetch activity dates.
//echo $OUTPUT->activity_information($cm, $completiondetails, $activitydates);

$comp = new completion_info($course);
if (isset($_POST['complete']) and $_POST['complete'] == 'complete') {
    $comp->update_state($cm, COMPLETION_INCOMPLETE);
}



echo $OUTPUT->footer();
