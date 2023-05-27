<?php

namespace mod_htmleditor\output;

use moodle_url;
use context_module;
use renderable;
use renderer_base;
use single_button;
use templatable;
use url_select;

class standard_action_bar implements renderable, templatable {
    private $cm;
    private $module;
    private $context;


    public function __construct(object $cm, object $module) {
        $this->cm = $cm;
        $this->module = $module;
        $this->context = context_module::instance($this->cm->id);
    }

    public function export_for_template(renderer_base $output) {
        return [
            'textfield' => $this->create_text_field($output),
        ];
    }

    private function create_text_field(renderer_base $output) {
        global $OUTPUT;

        return "text?";

    }

}
