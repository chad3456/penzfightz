# The loader, and the sheet

Two changes that touch every gallery in the case at once.

---

## One · Grid first, sphere on a switch

Every gallery here used to open as a globe. The globe is the better **object**:
it has a far side, it turns, and a thousand cards on it read as one thing rather
than as a thousand things. It is the worse **catalogue**: half the set is always
behind the other half, and there is no way to run your eye down a column.

The first question anybody asks a gallery is *what is in it*. So the grid is now
the default and the sphere is a switch, which is the right way round.

Both are the same instanced mesh and the same picker; only three things differ.

- **Placement.** A Fibonacci sphere, or a row-major sheet.
- **Orientation.** On the sphere a card faces outward and "lift" is along the
  radius. On the sheet it faces the camera and lift is along +z. Same gesture,
  fixed direction.
- **The controls.** A sphere is turned; a sheet is dragged. `enableRotate` and
  `enablePan` swap, and the mouse and touch bindings go with them.

Two details in the sheet were worth solving rather than eyeballing.

**How many columns.** If the sheet is `cols` wide and `count/cols` tall, and a
card is `aspect` wide per unit of height, the sheet's own proportion is
`cols²·aspect / count`. Setting that to 1.7 — roughly a landscape screen — and
rearranging gives `cols = √(1.7·count / aspect)`. Portrait cards therefore get
more columns, which is what anybody laying out contact prints does without
thinking about it. Two and a half thousand portrait drawings come out as 74
columns; two thousand square ones as 59.

**The pitch follows the card in each axis.** Uniform pitch with portrait cards
gives three times the gutter across that it gives down, and the sheet reads as
columns rather than as a grid.

And one that only a screenshot catches: **the last row is centred on itself.**
It is nearly always short, and centred on the full width it hangs off one side
and the whole sheet looks lopsided.

### A camera that is read once

`<Canvas camera={...}>` is read when React Three Fiber builds the camera and
never again. A gallery that changes size under a filter therefore keeps the
camera it was given for the size it used to be — switching Name and Form from
two thousand cards to two hundred and sixty-eight left the camera forty units
out from a sphere six across, and the gallery came up as a marble in the middle
of the screen. The canvas is now keyed on the layout, the radius and the card
shape, so a change of any of them remounts it. A different gallery is a
different view.

---

## Two · The loading screen is a workshop

A loading screen has one job everybody agrees on — say how far along it is — and
one that nobody does, which is to be worth looking at while it says so. A
spinner is an apology.

The wait is the only moment in the whole site when the machinery is *visibly
running*, so the loader shows the machinery.

### The plotter

A flatbed plotter: a gantry across the bed, a carriage along the gantry, a pen
that puts down a line that stays. The carriage speed is read off the real
cells-per-second, so a fast machine visibly draws faster. It is a gauge, not an
animation.

Hold the pointer down anywhere on the bed and **you have the pen**. The ink it
lays is yours, in the gallery's own accent colour. It is a doodle pad with a
progress bar attached, which is the only kind of loading screen anybody has been
sorry to see end.

The sheet is wiped slowly rather than never, at random, so a two-hundred-second
bake does not finish as a solid rectangle of ink.

### The output tray

Beside the plotter, finished specimens stack up. They are not drawings of
specimens — they are **blitted straight out of the atlas being baked**, which
costs nothing, because those pixels already exist.

For that to work through the whole bake and not just at the end, the bakers hand
over the plate *as it is being filled*, at every yield, rather than only when it
is finished. Without that a gallery that fits on a single plate — a hundred
portraits, say — has an empty tray for the entire bake and a full one for a
tenth of a second. The tray then restocks on a timer rather than on plates
landing, so it drips rather than jumps.

### The readout

Cells drawn, rate, elapsed, an estimate, plate count and geometry, atlas
dimensions in pixels and megapixels. If a person is going to be made to wait
they are at least owed the numbers. The rate is smoothed over about a second,
because instantaneous rate on a thread that yields in bursts reads as noise and
a running average reads as a machine.

Under it, two or three lines about what is actually being made, rotating every
five seconds — the ones each effect's own documentation opens with.

### The rule that kept it honest

**It must not compete for the thread.** The bake is on the main thread, yielding
every dozen cells. The plotter is a few dozen strokes a frame and one blit.
Anything heavier and the loader would make the load slower, which is a special
kind of stupid.

The panel is centred over the gallery's own ground rather than covering it, so
the sheet visibly fills in behind the glass while the tray fills in front of it.

---

## What is not covered

**Roll Call keeps its sphere.** Its wall is an older, separate component with
interactions that are sphere-specific — focus a set and it gathers to the front
while the rest fall back to a core, you can fly inside it, and you can pull a
card off it with a shift-drag. It has the new loader; it does not have the grid,
because a grid would need all three of those redesigned rather than ported.
