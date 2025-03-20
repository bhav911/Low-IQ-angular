import { Component, DestroyRef, ElementRef, EventEmitter, inject, input, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { SubCommentBoxComponent } from "./sub-comment-box/sub-comment-box.component";
import { AuthService } from "../../../../../core/services/auth.service";
import { UserReviewService } from "../../../_services/user-review.service";
import { Observable, Subject, take, takeUntil } from "rxjs";
import { User } from "../../../../../core/models/User.model";
import { Comment } from "../../../../../core/models/comment.model";


@Component({
  selector: 'app-comment-box',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, SubCommentBoxComponent],
  templateUrl: './comment-box.component.html',
  styleUrl: './comment-box.component.css',
})
export class CommentBoxComponent implements OnInit {

  private authService = inject(AuthService);

  private userReviewService = inject(UserReviewService);
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef)

  private destroy$ = new Subject<void>();

  private listeners: (() => void)[] = [];
  @Output() deleted = new EventEmitter();
  comment = input.required<Comment>();
  quizId = input.required<string>();
  user: User | null | undefined = undefined
  showReplyInput = false;
  subCommentForm: FormGroup;
  showMoreOptions = false;
  showSubComments: boolean = false;
  showInput = false;
  showDeleteOptions = false;
  hasMoreComments: boolean | undefined = undefined;
  repliesPage = 1;
  createdAt = "";

  @ViewChild('subComment') subCommentInput!: ElementRef<HTMLTextAreaElement>;

  constructor() {
    this.subCommentForm = new FormGroup({
      subComment: new FormControl(),
      editedComment: new FormControl()
    })
  }

  ngOnInit(): void {

    this.subCommentForm.get('subComment')?.setValue(`@${this.comment().userId.username} `)

    const date = new Date(+this.comment().createdAt);
    this.createdAt = date.toLocaleDateString()

    this.comment().replies = []
    this.authService.userValue
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(user => {
        this.user = user;
      })

    const elements = this.el.nativeElement.querySelectorAll('.comment-item');

    elements.forEach((element: HTMLElement) => {
      const listener = this.renderer.listen(element, 'mouseleave', (event) => {
        this.showMoreOptions = false;
      });
      this.listeners.push(listener);
    });

    this.destroyRef.onDestroy(() => {
      this.listeners.forEach(unlisten => unlisten());
    })
  }

  ngAfterViewChecked() {
    if (this.showReplyInput && this.subCommentInput) {
      setTimeout(() => {
        // this.subCommentInput.nativeElement.focus();
      });
    }
  }

  updateCommentReaction(reaction: any) {
    let prevReaction = this.comment().reaction;
    this.userReviewService.updateCommentReaction(this.comment()._id!, reaction)
      .subscribe(
        success => {
          if (reaction === prevReaction) {
            reaction = null;
          }
          if (prevReaction !== null)
            this.comment().reactionCount[prevReaction]--;

          this.comment().reaction = reaction;
          if (reaction !== null)
            this.comment().reactionCount[this.comment().reaction!]++;
        }
      )
  }

  toggleMoreOption() {
    this.showMoreOptions = !this.showMoreOptions
  }

  deleteComment() {
    this.userReviewService.deleteComment(this.comment()._id!)
      .subscribe(
        next => {
          this.toggleDeleteConfirmation(false);
          this.toggleMoreOption();
          this.deleted.emit(this.comment()._id);
        }
      )
  }

  addNewSubComment(comment: string) {
    this.createReply(comment)
  }

  toggleDeleteConfirmation(show: boolean) {
    this.showDeleteOptions = show;
  }

  removeSubComment(subCommentId: string) {
    this.comment().replies = this.comment().replies?.filter(c => c._id !== subCommentId);
    this.comment().repliesCount!--;
    if (this.comment().repliesCount === 0) {
      this.hideSubComments()
    }
  }

  editcomment() {
    this.toggleInput();
    this.subCommentForm.controls['editedComment'].patchValue(this.convertMentionsToPlainText(this.comment().text));
  }

  toggleInput() {
    this.showInput = !this.showInput;
  }

  createReply(reply?: string) {
    const comment = reply ?? this.subCommentForm.controls['subComment'].value;
    this.userReviewService.createComment(comment, this.quizId(), this.comment()._id)
      .subscribe({
        next: comment => {
          this.comment().replies?.push(comment);
          this.comment().repliesCount++;

          this.showSubComments = true;
          this.subCommentForm.controls['subComment'].setValue(`@${this.comment().userId.username} `)

          this.showReplyInput = false;
          if (this.comment().replies!.length < this.comment().repliesCount)
            this.hasMoreComments = true;
        }
      })
  }

  saveEditedComment() {
    let comment = this.subCommentForm.controls['editedComment'].value;

    this.userReviewService.updateComment(comment, this.comment()._id!)
      .subscribe((comment: Comment) => {
        this.toggleInput();
        this.comment().text = comment.text
      })
  }

  fetchSubComments() {
    if (this.comment().repliesCount === this.comment().replies!.length) {
      this.showSubComments = true;
      this.hasMoreComments = false
      return;
    }
    const existingIds = new Set(this.comment().replies?.map(r => r._id));
    this.userReviewService.fetchReplies(this.comment()._id!, this.repliesPage)
      .subscribe({
        next: replies => {
          this.repliesPage++;

          //this step to remove duplicates created when replying
          this.comment().replies!.push(...replies.filter((r: any) => !existingIds.has(r._id)));
          this.hasMoreComments = this.comment().repliesCount > this.comment().replies!.length
          this.showSubComments = true;
        }
      })
  }

  hideSubComments() {
    this.showSubComments = false;
    this.hasMoreComments = undefined
  }

  toggleReplyBox() {
    this.showReplyInput = !this.showReplyInput;
  }

  convertMentionsToPlainText(html: string) {
    // Regex to find <a> tags with class "mention"
    return html.replace(
      /<a[^>]+class="mention"[^>]*>(.*?)<\/a>/g,
      "$1"
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
