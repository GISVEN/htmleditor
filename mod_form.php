<?php

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');
require_once($CFG->dirroot.'/mod/htmleditor/lib.php');

class mod_htmleditor_mod_form extends moodleform_mod {

    function definition() {
        global $CFG, $DB, $OUTPUT, $PAGE;

//        $PAGE->requires->js( new moodle_url( "/mod/htmleditor/local/rulesManager.js"));

        $rules_ids_array = [];
        $mform =& $this->_form;
        $id = $this->get_instance();

        $mform->addElement('hidden', 'from', $PAGE->url);
        $mform->setType('from', PARAM_TEXT);


        $_POST;
        $_GET;


        // получает запись из htmteditor таблицы
        $instance = $DB->get_record('htmleditor', array("id"=>$id));
        // получает строку с ид правил
        $rules_ids_string = $instance->rules;


        if ($rules_ids_string != null && strlen($rules_ids_string) > 0) {
            // разделяем строку и пихаем в массив
            $rules_ids_array = explode(' ', $rules_ids_string);
        }


        if (sizeof($rules_ids_array) > 0) {
            $mform->addElement('hidden', 'rules_ids_count', sizeof($rules_ids_array));
            $mform->setType('rules_ids_count', PARAM_INT);
        }


        $mform->addElement('html', '
        <style>
            .custom_group{
                border: 1px solid lightgrey;
                padding-top: 15px;
                padding-left: 15px;
                padding-right: 15px;
                margin-bottom: 15px;
            }
            .sub_rule_group{
                margin: 10px;
                padding-top: 10px;
                padding-left: 30px;
                border: 1px lightgrey dotted;
            }
        </style>');

        // поле ввода имени задания
        $mform->addElement('text', 'name', get_string('taskname', 'mod_htmleditor'), array('size'=>'64'));
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', get_string('no_name_error','mod_htmleditor'), 'required', null, 'client');

        // поле placeholder
        $mform->addElement('textarea', 'placeholder', get_string('placeholder', 'mod_htmleditor'), 'rows=20');
        $mform->addRule('placeholder', get_string('no_placeholder_error', 'mod_htmleditor'), 'required', null, 'client');

        // контейнер для правил
        $mform->addElement('html', '<div id="rules_group">');


        $rules_all = $DB->get_records('htmleditor_rules', array());



        // функция возвращает массив содержащий все child_id
        function getRuleChildIds($rule_id, $rules_all): array {
            $child_ids = $rules_all[$rule_id]->child_id;
            return $child_ids != null ? explode(' ', $rules_all[$rule_id]->child_id) : array();
        }
        $values_to_form = array();

        function addRule($rule_id, MoodleQuickForm $mform, $rules_all, $i = 0, $sub = false) {
            $values_to_form = array();
            $rule_text_name = 'rule_text-'.$rule_id;
            $rule_name = 'rule_name-'.$rule_id;
            $select_name = 'select-'.$rule_id;
            $is_root = $rules_all[$rule_id]->root == 1;

            if ($is_root) {
                $mform->addElement(
                    'text',
                    $rule_name,
                    get_string($sub?'sub_rule':'rule', 'htmleditor').' '.($i+1),
                    array('size'=>'64')
                );
                $mform->addRule($rule_name, '', 'required');
            }


            $mform->addElement(
                'text', 
                $rule_text_name, 
                get_string('rule_value', 'htmleditor'), 
                array('size'=>'64')
            );
            $mform->addRule($rule_text_name, '', 'required');

            if ($is_root) {
                $rule_description_name = 'rule_description-'.$rule_id;
                $mform->addElement(
                    'textarea',
                    $rule_description_name,
                    get_string('rule_description', 'mod_htmleditor'),
                    'wrap="soft" rows="10"'
                );
                $mform->addRule($rule_description_name, '', 'required');
            }

            $root_button_name = '';
            if ($is_root) {
                $root_button_name =  'unroot-'.$rule_id;
                $mform->addElement(

                    'submit',
                    'unroot-'.$rule_id,
                    get_string('set_as_not_root', 'htmleditor')
                );
            } else {
                $root_button_name =  'setroot-'.$rule_id;
                $mform->addElement(
                    'submit',
                    'setroot-'.$rule_id,
                    get_string('set_as_root', 'htmleditpr')
                );
            }
            $mform->registerNoSubmitButton($root_button_name);



            $text_to_text = $rules_all[$rule_id]->rule_text;
            $type_to_type = $rules_all[$rule_id]->rule_type;
            if ($is_root) {
                $name_to_name = $rules_all[$rule_id]->name;
                $desc_to_desc = $rules_all[$rule_id]->description;
            }


            if (isset($_POST[$rule_text_name])) $text_to_text = $_POST[$rule_text_name];
            if (isset($_POST['add_delete_buttons_group'][$select_name])) $type_to_type = $_POST['add_delete_buttons_group'][$select_name];

            if ($is_root) {
                if (isset($_POST[$rule_name])) $name_to_name = $_POST[$rule_name];
                if (isset($_POST[$rule_description_name])) $desc_to_desc = $_POST[$rule_description_name];
            }


            if (isset($_GET[$rule_text_name])) $text_to_text = $_GET[$rule_text_name];
            if (isset($_GET[$select_name])) $type_to_type = $_GET[$select_name];

            if ($is_root) {
                if (isset($_GET[$rule_name])) $name_to_name = $_GET[$rule_name];
                if (isset($_GET[$rule_description_name])) $desc_to_desc = $_GET[$rule_description_name];

            }


            if ($text_to_text != '')
                $values_to_form[$rule_text_name] = $text_to_text;
            if ($type_to_type != '')
                $values_to_form[$select_name] = $type_to_type;
            if ($is_root and $name_to_name != '')
                $values_to_form[$rule_name] = $name_to_name;
            if ($is_root and $desc_to_desc != '')
                $values_to_form[$rule_description_name] = $desc_to_desc;


            $add_delete_buttons_array = array();
            $add_button_name = 'add_new_sub_rule-'.$rule_id;
            $delete_button_name = 'delete_sub_rule-'.$rule_id;

            $types = [
                'exist' => get_string('exist_type', 'htmleditor'),
                'delete' => get_string('delete_type', 'htmleditor')
            ];



            $add_delete_buttons_array[] = &$mform->createElement('submit', $add_button_name, get_string('add_new_sub_rule', 'htmleditor'));
            $add_delete_buttons_array[] = &$mform->createElement('submit', $delete_button_name, get_string('delete_sub_rule', 'htmleditor'));
            $select = $mform->createElement('select', $select_name, get_string('type_select', 'htmleditor', ), $types);
            $add_delete_buttons_array[] = &$select;

            $mform->addGroup($add_delete_buttons_array, 'add_delete_buttons_group');
            if ($type_to_type != '')
                $select->setSelected($type_to_type);
            $mform->registerNoSubmitButton($add_button_name);
            $mform->registerNoSubmitButton($delete_button_name);






            $rule_childs = getRuleChildIds($rule_id, $rules_all);
            foreach ($rule_childs as $rule_child) {
                $mform->addElement('html', '<div class="sub_rule_group">');
                $values_to_form += addRule($rule_child, $mform, $rules_all, $i+1, true);
                $mform->addElement('html', '</div>');
            }

            return $values_to_form;

        }


        for ($i=0; $i<sizeof($rules_ids_array); $i++) {
            // контейнер для правила
            $mform->addElement('html', '<div class="custom_group">');
            $values_to_form += addRule($rules_ids_array[$i], $mform, $rules_all, $i, false);
            $mform->addElement('html', '</div>');
        }

        $this->set_data($values_to_form);

//        $mform->addElement('hidden', 'values_to_form', implode('-sep-', $values_to_form));

        if ($this->_instance != '') {
            $mform->addElement('html', '</div>');
            // кнопка для добавления нового провила в конец
            $mform->addElement('submit', 'add_new_rule_last', get_string('add_new_rule_last', 'htmleditor'));
            $mform->registerNoSubmitButton('add_new_rule_last');
        }



        $this->standard_coursemodule_elements();

        $this->add_action_buttons();

        $includes = false;
        $nsbutton = '';
        foreach ($mform->_noSubmitButtons as $button) {
            if ($button == 'unlockcompletion') continue;
            if (!$includes and (isset($_POST['add_delete_buttons_group'][$button]) or isset($_POST[$button]) )) {
                $includes = true;
                $nsbutton = $button;
            }
        }

        if ($includes) {
            // действие для кнопки add_new_rule_last
            if ($nsbutton == 'add_new_rule_last') {
                // получаем запись из htmteditor таблицы
                $instance = $DB->get_record('htmleditor', array("id"=>$_POST['instance']));
                // получаем строку с ид правил
                $rules_ids_string = $instance->rules;

                $rule_id = $DB->insert_record(
                    'htmleditor_rules',
                    [
                        'rule_text'=>'<div></div>',
                        'rule_type'=>'exist',
                        'root' => 1
                    ]
                );
                if (strlen($rules_ids_string) > 0) {
                    $rules_ids_string .= ' ';
                }
                $new_instance_rules = $rules_ids_string.$rule_id;
                $DB->set_field('htmleditor', 'rules', $new_instance_rules, array('id'=>$instance->id));

            }
            else {
                $nsbutton_exploded = explode('-', $nsbutton);
                $nsbutton_name = $nsbutton_exploded[0];
                $nsbutton_id = $nsbutton_exploded[1];

                if ($nsbutton_name == 'add_new_sub_rule') {
                    // получаем запись правила из таблицы
                    $rule_instance = $DB->get_record('htmleditor_rules', array('id'=>$nsbutton_id));
                    // получаем id из записи
                    $rule_child_ids = $rule_instance->child_id;
                    // если строка не путсая, добавляем в конец пробел
                    if (strlen($rule_child_ids)>0) $rule_child_ids .= " ";
                    // создаем новое правило
                    $rule_id = $DB->insert_record('htmleditor_rules', array('rule_text'=>'<div></div>', 'rule_type'=>'exist'));
                    // добавляем в правило субправило
                    $ret = $DB->set_field('htmleditor_rules', 'child_id', $rule_child_ids.$rule_id, array('id'=>$nsbutton_id));
                }
                elseif ($nsbutton_name == 'delete_sub_rule') {


                    function deleteRuleFromTask($task_id, $rule_id) {
                        global $DB;
                        $instance = $DB->get_record('htmleditor', ["id"=>$task_id]);
                        $instance_rules = $instance->rules;
                        if (strlen($instance_rules) > 0) {
                            // разделяем строку на массив
                            $instance_rules_array = explode(' ', $instance_rules);
                            // ищем индекс удаляемого правила
                            $index = array_search($rule_id, $instance_rules_array);
                            // если нашли, удаляем из массива
                            if ($index !== false) unset($instance_rules_array[$index]);
                            // объеденияем массив в строку
                            $instance_rules = implode(' ', $instance_rules_array);
                            // обновляем ид правил в задании
                            $DB->set_field('htmleditor', 'rules', $instance_rules, array('id'=>$task_id));
                        }

                    }
                    function deleteRuleFromRule($rule, $delete_rule_id) {
                        global $DB;
                        $child_ids = $rule->child_id;
                        if ($child_ids == null or $child_ids == '') return;
                        // разделяем строку на массив
                        $child_ids_array = explode(' ', $child_ids);
                        // ищем индекс удаляемого правила
                        $index = array_search($delete_rule_id, $child_ids_array);
                        // если нашли, удаляем из массива
                        if ($index !== false) unset($child_ids_array[$index]);
                        // объеденияем массив в строку
                        $child_ids = implode(' ', $child_ids_array);
                        // обновляем ид правил в задании
                        $DB->set_field('htmleditor_rules', 'child_id', $child_ids, array('id' => $rule->id));
                    }
                    function deleteRuleFromRules($delete_rule_id, array $rules_all) {
                        global $DB;
                        foreach ($rules_all as $rule) {
                            deleteRuleFromRule($rule, $delete_rule_id);

                        }

                    }
                    function deleteRuleChilds($rule_id, $rules_all) {
                        global $DB;
                        $rule = $rules_all[$rule_id];
                        $rule_childs = $rule->child_id;
                        if (!$rule_childs == '' and !$rule_childs == null) {
                            $rule_childs_array = explode(' ', $rule_childs);
                            foreach ($rule_childs_array as $child_id) {
                                deleteRuleChilds($child_id, $rules_all);
                            }
                        }
                        $DB->delete_records('htmleditor_rules', ['id'=>$rule_id]);

                    }

                    function deleteRuleById($rule_id, array $rules_all) {
                        deleteRuleFromTask($_POST['instance'], $rule_id);
                        deleteRuleChilds($rule_id, $rules_all);
                        deleteRuleFromRules($rule_id, $rules_all);
                    }

                    deleteRuleById($nsbutton_id, $rules_all);

                } elseif ($nsbutton_name == 'unroot') {
                    $DB->set_field('htmleditor_rules', 'root', 0, ['id'=>$nsbutton_id]);

                } elseif ($nsbutton_name == 'setroot') {
                    $DB->set_field('htmleditor_rules', 'root', 1, ['id'=>$nsbutton_id]);
                }

            }

            $get_atributes = '';
            foreach (array_keys($values_to_form) as $key) {
                $get_atributes .= "&".$key."=".urlencode($values_to_form[$key]);
            }

            redirect(new moodle_url( $_POST['from']).$get_atributes);
        }

        /*if ($this->is_cancelled()) {

            var_dump("is_cancelled");

        } else if ($this->is_submitted()) {
            $data = $this->get_data();

            $rules_texts = array();
            foreach ($rules_el_names as $rules_el_name) {
                $rules_texts[$rules_el_name] = $data[$rules_el_name];
            }

            $mform->addElement('hidden', 'rules_texts', $rules_texts);


        }*/
    }
}

