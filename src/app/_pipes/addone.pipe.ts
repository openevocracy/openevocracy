import {Pipe, PipeTransform} from "@angular/core";

@Pipe({name: 'addone'})
export class AddonePipe implements PipeTransform {
    /**
     *
     * @param value
     * @returns value + 1
     */
    transform(value: number): number {
        return value+1;
    }
}
