import {Pipe, PipeTransform} from "@angular/core";

import { UtilsService } from '../_services/utils.service';

@Pipe({name: 'timestamp'})
export class TimestampPipe implements PipeTransform {
    
    constructor(private utilsService: UtilsService) { }
    
    /**
     *
     * @param objectId as string
     * @returns timestamp from objectId
     */
    transform(objId: string): number {
        return this.utilsService.getTimestampFromObjectId(objId);
    }
}