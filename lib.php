<?php

function htmleditor_add_instance($htmleditor) {
    global $DB;
    $returnid = $DB->insert_record("htmleditor", $htmleditor);
    $htmleditor->id = $returnid;
    return $returnid;
}

function htmleditor_update_instance($htmleditor) {
    global $DB;
    $htmleditor->id = $htmleditor->instance;

    $vars = get_object_vars($htmleditor);
    $vars_keys = array_keys($vars);
    $rules = array();
    foreach ($vars_keys as $key) {

        if (str_contains($key, "rule_text-")) {
            $rule_text = $vars[$key];
            $key_exploded = explode('-', $key);
            $rules[$key_exploded[1]]['text'] = $rule_text;
        }

        if (str_contains($key, "rule_name-")) {
            $rule_name = $vars[$key];
            $key_exploded = explode('-', $key);
            $rules[$key_exploded[1]]['name'] = $rule_name;
        }

        if (str_contains($key, "rule_description-")) {
            $rule_description = $vars[$key];
            $key_exploded = explode('-', $key);
            $rules[$key_exploded[1]]['description'] = $rule_description;
        }

        if ($key == 'add_delete_buttons_group') {
            $group_array = $vars[$key];
            foreach (array_keys($group_array) as $group_array_key) {
                if (str_contains($group_array_key, 'select-')) {
                    $rule_type = $group_array[$group_array_key];
                    $key_exploded = explode('-', $group_array_key);
                    $rules[$key_exploded[1]]['type'] = $rule_type;
                }
            }
        }
    }

    $rules_keys = array_keys($rules);

    foreach ($rules_keys as $key) 
    {
        $DB->set_field(
            'htmleditor_rules', 
            'rule_text', 
            $rules[$key]['text'], 
            ['id'=>$key]
        );

        $DB->set_field(
            'htmleditor_rules', 
            'rule_type', 
            $rules[$key]['type'] ?? 'exist', 
            ['id'=>$key]
        );

        $DB->set_field(
            'htmleditor_rules', 
            'name', 
            $rules[$key]['name'], 
            ['id'=>$key]
        );

        $DB->set_field(
            'htmleditor_rules', 
            'description', 
            $rules[$key]['description'], 
            ['id'=>$key]
        );
    }

    return $DB->update_record("htmleditor", $htmleditor);


}

function htmleditor_delete_instance( $id ) {
    global $DB, $CFG;



    $instance = $DB->get_record('htmleditor', array("id"=>$id));
    if ($instance === false) {
        return false;
    }
    $rules_ids_string = $instance->rules;
    if (sizeof($rules_ids_string) > 0) {
        $rules_ids_array = explode(' ', $rules_ids_string);
    }
    foreach ($rules_ids_array as $rule_id) {
        $DB->get_records('htmleditor_rules', array("id"=>$rule_id));
    }

    $DB->delete_records('htmleditor', array("id"=>$id));

}

function htmleditor_supports($features) {
    switch ($features) {
        case FEATURE_PLAGIARISM: return true;
        case FEATURE_MOD_PURPOSE: return MOD_PURPOSE_ASSESSMENT;
    }
}

