<?php

class TaskClass
{
    public string $name;
    public string $start;
    public string $description;
    public array $answers;
    public string $final;
    function __construct(string $name, string $start, string $description, array $answers, string $final) {
        $this->name = $name;
        $this->start = $start;
        $this->description = $description;
        $this->answers = $answers;
        $this->final = $final;
    }

}