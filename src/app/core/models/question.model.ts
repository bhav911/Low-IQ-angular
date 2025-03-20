import { FormArray, FormControl, FormGroup } from "@angular/forms";

export interface QuestionStruct {
    question: FormControl<string | null>;
    questionImage: FormControl<string | null>;
    options: FormArray<FormGroup<OptionStruct>>,
    point: FormControl<number>;
}

export interface OptionStruct {
    option: FormControl<string | null>;
    isCorrect: FormControl<boolean>;
}