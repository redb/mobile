import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, ActionSheetController } from 'ionic-angular';

import { ChannelComponent } from '../channel/channel.component';
import { Client } from '../../common/services/api/client';
import { Storage } from '../../common/services/storage';

import { MessengerSetup } from './setup.component';
import { MessengerView } from './view.component';

@Component({
  moduleId: 'module.id',
  selector: 'messenger-list',
  templateUrl: 'list.component.html',
  //styleUrls: ['list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MessengerList {

  conversations : Array<any> = [];
  offset : string = "";
  inProgress : boolean = true;

  components = {
    view: MessengerView,
    channel: ChannelComponent
  }

  constructor(private client : Client, private cd : ChangeDetectorRef, private nav : NavController,
    private storage : Storage, private actionSheetCtrl : ActionSheetController){

  }

  ngOnInit(){
    if(!this.storage.get('private-key')){
      return this.nav.setRoot(MessengerSetup);
    }
    this.loadList();
  }

  loadList(){
    return new Promise((res, err) => {
      this.inProgress = true;
      this.client.get('api/v2/conversations', { limit: 12, offset: this.offset})
        .then((response : any) => {
          //console.log(response);
          for(let convo of response.conversations){
            this.conversations.push(convo);
          }
          this.inProgress = false;
          this.offset = response['load-next'];
          res();
          this.cd.markForCheck();
          this.cd.detectChanges();
        });
    });
  }

  refresh(puller){
    puller.complete();
    this.offset = "";
    this.conversations = [];
    this.loadList()
      .then(() => {
        puller.complete();
      });
  }

  loadMore(e){
    this.loadList()
      .then(() => {
        e.complete();
      });
  }

  openOptions(i, e){
    e.preventDefault();

    let buttons = [{
        text: 'Delete',
        icon: 'md-trash',
        role: 'destructive',
        handler: () => {
          this.client.delete('api/v2/conversations/' + this.conversations[i].guid);
          this.conversations.splice(i,1);
          this.cd.markForCheck();
          this.cd.detectChanges();
        }
      },
      {
        text: 'Cancel',
        icons: 'md-cancel',
        role: 'cancel'
      }];

    let actionSheet = this.actionSheetCtrl.create({
      buttons: buttons
    });
    actionSheet.present();
  }

}
