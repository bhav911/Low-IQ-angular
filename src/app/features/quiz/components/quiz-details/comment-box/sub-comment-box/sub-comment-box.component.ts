import { Component, EventEmitter, HostListener, inject, input, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AccountService } from "../../../../../../core/services/account.service";
import { AuthService } from "../../../../../../core/services/auth.service";
import { UserReviewService } from "../../../../_services/user-review.service";
import { Observable, Subject, takeUntil } from "rxjs";
import { User } from "../../../../../../core/models/User.model";
import { Comment } from "../../../../../../core/models/comment.model";


// imports: [RouterLink, ReactiveFormsModule, AutoSizeDirective],
@Component({
  selector: 'app-sub-comment-box',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sub-comment-box.component.html',
  styleUrl: './sub-comment-box.component.css'
})
export class SubCommentBoxComponent implements OnInit {

  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private userReviewService = inject(UserReviewService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  @Output() deleted = new EventEmitter();
  @Output() newReply = new EventEmitter();
  subComment = input.required<Comment>();
  quizId = input.required<string>();
  user: User | null | undefined = undefined
  showReplyInput = false;
  subCommentForm: FormGroup;
  showInput = false;
  showMoreOptions = false;
  showDeleteOptions = false;
  createdAt = "";

  constructor() {
    this.subCommentForm = new FormGroup({
      subComment: new FormControl(),
      editedComment: new FormControl()
    })
  }

  ngOnInit(): void {
    this.subCommentForm.controls['subComment'].setValue(`@${this.subComment().userId.username} `)

    const date = new Date(+this.subComment().createdAt);
    this.createdAt = date.toLocaleDateString()

    this.authService.userValue
      .pipe(
        takeUntil(this.destroy$) // Automatically unsubscribe on service destroy
      )
      .subscribe(user => {
        this.user = user
      })
  }

  @HostListener('mouseleave')
  onHoverAway() {
    this.showMoreOptions = false;
  }

  updateCommentReaction(reaction: any) {
    let prevReaction = this.subComment().reaction;
    this.userReviewService.updateCommentReaction(this.subComment()._id!, reaction)
      .subscribe(
        success => {
          if (reaction === prevReaction) {
            reaction = null;
          }
          if (prevReaction !== null)
            this.subComment().reactionCount[prevReaction]--;

          this.subComment().reaction = reaction;
          if (reaction !== null)
            this.subComment().reactionCount[this.subComment().reaction!]++;
        }
      )
  }

  deleteComment() {
    this.userReviewService.deleteComment(this.subComment()._id!)
      .subscribe(
        next => {
          this.toggleDeleteConfirmation(false);
          this.toggleMoreOption();
          this.deleted.emit(this.subComment()._id);
        }
      )
  }

  toggleReplyBox() {
    this.showReplyInput = !this.showReplyInput;
  }

  toggleDeleteConfirmation(show: boolean) {
    this.showDeleteOptions = show;
  }

  editcomment() {
    this.toggleInput();
    this.subCommentForm.controls['editedComment'].patchValue(this.convertMentionsToPlainText(this.subComment().text))
  }

  toggleMoreOption() {
    this.showMoreOptions = !this.showMoreOptions
  }

  toggleInput() {
    this.showInput = !this.showInput;
  }

  saveEditedComment() {
    let comment = this.subCommentForm.controls['editedComment'].value;

    this.userReviewService.updateComment(comment, this.subComment()._id!)
      .subscribe((comment: Comment) => {
        this.toggleInput();
        this.subComment().text = comment.text
      })
  }

  createReply() {
    let comment: string = this.subCommentForm.controls['subComment'].value;
    this.newReply.emit(comment)
    this.subCommentForm.controls['subComment'].setValue(`@${this.subComment().userId.username} `)
    this.showReplyInput = false;
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
