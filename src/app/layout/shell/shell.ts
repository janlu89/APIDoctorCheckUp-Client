import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Topbar } from "../topbar/topbar";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, Topbar],
  templateUrl: "./shell.html",
  styleUrl: "./shell.css"
})
export class Shell {}
