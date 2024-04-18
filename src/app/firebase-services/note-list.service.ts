import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface';
import {
  Firestore,
  collection,
  doc,
  DocumentData,
  collectionData,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NoteListService {
  trashNotes: Note[] = []; // denke es sollte trash sein
  normalNotes: Note[] = [];

  unsubTrash;
  unsubNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubTrash = this.subTrashList();
    this.unsubNotes = this.subNotesList();
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch((err) => {
        console.log(err);
      });
    }
    // .then(); // hier können weitere Aktionen angereiht werden
  }

  async deleteNote(colId: 'notes' | 'trash', docId: string) {
    await deleteDoc(this.getSingleDocRef(colId , docId ))
    .catch(err => console.log(err));
  }

  getCleanJson(note: Note): {} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    };
  }

  getColIdFromNote(note: Note): string {
    if (note.type == 'note') {
      return 'notes';
    } else {
      return 'trash';
    }
  }

  ngonDestroy() {
    this.unsubTrash();
    this.unsubNotes();
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id || '',
      type: obj.type || 'note',
      title: obj.title || '',
      content: obj.content || '',
      marked: obj.marked || false,
    };
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach((element) => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subNotesList() {
    let q = query(this.getNotesRef(), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach((element) => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subMarkedNotesList() {
    let q = query(this.getNotesRef(), where('marked', '==', true), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach((element) => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  async addNote(note: Note, colId: 'notes' | 'trash') {
    if (colId == 'notes') {
      await addDoc(this.getNotesRef(), note)
      .catch((err) => {
        console.error(err);
      })
      // .then(
      //   // generell können hier weitere Aktionen angfügt werden
      //   (docRef) => {
      //     console.log('Document written with ID: ', docRef?.id);
      //   }
      // );
    } else {
      await addDoc(this.getTrashRef(), note)
      .catch((err) => {
        console.error(err);
      })
    }
    
      
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
