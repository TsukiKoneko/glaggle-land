// Services //
import { Players, TextService } from "@rbxts/services";

// Console GUI Type //
type ConsoleUI = ScreenGui & {
	Container: Frame & {
		MainContainer: Frame & {
			UIPadding: UIPadding;
			Main: Frame & {
				UIListLayout: UIListLayout;
				CommandLine: Frame & {
					InputContainer: Frame & {
						Selection: Frame;
						UIPadding: UIPadding;
						DropdownContainer: Frame & {
							DropdownOffset: UIPadding;
							DropdownTopbar: Frame & {
								Info: TextLabel;
								UIPadding: UIPadding;
							};
							DropdownListContainer: Frame & {
								DropdownList: ScrollingFrame & {
									Option: TextButton & {
										Input: TextLabel;
										Label: TextLabel;
									};
									OptionsListLayout: UIListLayout;
								};
								DropdownListPadding: UIPadding;
							};
						};
						InputLine: TextBox & {
							RichTextMarkup: TextLabel;
						};
						Caret: Frame;
					};
					Executor: TextButton;
				};
				Output: ScrollingFrame & {
					UIListLayout: UIListLayout;
					Line001: TextLabel;
				};
			};
		};
		UIPadding: UIPadding;
		Blur: Frame;
	};
};

// CLI Variables //
const console_UI: ConsoleUI = (Players.LocalPlayer.FindFirstChild("PlayerGui") as ScreenGui).WaitForChild("Console") as ConsoleUI;
const console_main_frame: Frame = console_UI.Container.MainContainer.Main;
const output_frame: ScrollingFrame = console_UI.Container.MainContainer.Main.Output;
const input_line_textbox: TextBox = console_UI.Container.MainContainer.Main.CommandLine.InputContainer.InputLine;
const input_markup_textbox: TextLabel = console_UI.Container.MainContainer.Main.CommandLine.InputContainer.InputLine.RichTextMarkup;
const selection_frame: Frame = console_UI.Container.MainContainer.Main.CommandLine.InputContainer.Selection;
const caret_frame: Frame = console_UI.Container.MainContainer.Main.CommandLine.InputContainer.Caret;
const dropdown_container: Frame = console_UI.Container.MainContainer.Main.CommandLine.InputContainer.DropdownContainer;

const richtext_escape_forms: { [key: string]: string } = {
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
	"&": "&amp;",
};

// CLI Event Connections //
let PropertyChanged_Text: RBXScriptConnection;
let PropertyChanged_CursorPosition: RBXScriptConnection;
let FocusedEvent: RBXScriptConnection;
let FocusLostEvent: RBXScriptConnection;

// Console Class //
export default class Console {
	//private ACTIVATION_KEY: Enum.KeyCode | string; --nrn

	// Constructor
	constructor() {}

	// Called when user focus is lost / found (invokes ConsoleUpdate method)
	private OnInputFocusLost() { caret_frame.Visible = false }
	private OnInputFocused() {
		task.spawn(() => this.ConsoleUpdate());
		while (input_line_textbox.IsFocused()) {
			caret_frame.Visible = !caret_frame.Visible;
			task.wait(0.5);
		}
	}

	// Update Console and GUI
	public ConsoleUpdate(): void {
		const raw_input: string = input_line_textbox.Text // Un-parsed full input
		const cursor_pos: number = input_line_textbox.CursorPosition
		input_markup_textbox.Text = raw_input.gsub("([<>'\"\&])", richtext_escape_forms)[0] // Fix richtext

		// Update caret position
		const caret_size: Vector2 = TextService.GetTextSize(string.sub(raw_input, 0, cursor_pos - 1), input_line_textbox.TextSize, input_line_textbox.Font, new Vector2(0, math.huge))
		caret_frame.Position = new UDim2(0, caret_size.X, 1, 0)

		// Update selection box size & position
		const selection_start: number = input_line_textbox.SelectionStart
		if (cursor_pos === -1 || selection_start === -1) { selection_frame.Visible = false } else {
			selection_frame.Visible = true

			// Selection endpoints
			const start_pos: number = math.min(cursor_pos, selection_start)
			const end_pos: number = math.max(cursor_pos, selection_start) - 1

			// Get selection bounds
			const selected_text: string = string.sub(raw_input, start_pos, end_pos)
			const selection_pos: Vector2 = TextService.GetTextSize(string.sub(raw_input, 0, (math.min(start_pos, end_pos)) - 1), input_line_textbox.TextSize, input_line_textbox.Font, new Vector2(0, math.huge))
			const selection_size: Vector2 = TextService.GetTextSize(selected_text, input_line_textbox.TextSize, input_line_textbox.Font, new Vector2(0, math.huge))

			// Resize and position selection
			selection_frame.Position = new UDim2(0, selection_pos.X, .5, 0)
			selection_frame.Size = new UDim2(0, selection_size.X, 1, 0)
		}
	}
	
	// Start console and connect events with ConsoleUpdate method
	public Start(): void {
		// Connect CLI Events
		PropertyChanged_Text = input_line_textbox.GetPropertyChangedSignal("Text").Connect(() => this.ConsoleUpdate());
		PropertyChanged_CursorPosition = input_line_textbox.GetPropertyChangedSignal("CursorPosition").Connect(() => this.ConsoleUpdate());
		FocusedEvent = input_line_textbox.Focused.Connect(() => this.OnInputFocused())
		FocusLostEvent = input_line_textbox.FocusLost.Connect(() => this.OnInputFocusLost())
		//add loop (runservice?) for dropdown container position updating; break when console closed; new .End() method? --> (Necessary, add later)

		input_line_textbox.CaptureFocus() // Runs ConsoleUpdate() method
	}

	// Close console, disconnect events
	public End(): void {
		// Disconnect CLI Events
		PropertyChanged_Text?.Disconnect()
		PropertyChanged_CursorPosition?.Disconnect()
		FocusedEvent?.Disconnect()
		FocusLostEvent?.Disconnect()
	}
}
