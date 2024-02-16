# KonStructEd

Kon Structure Editor is an experimental proof-of-concept structure editor for Lua.

It is a Web Application written in Solid.JS.

## Structure Editor?

Yes, structure editor. The best way to understand it is to run it yourself. If you want me to put this on a web host for your intrigue, consider creating an issue in this repository.

[Wikipedia gives a decent summary of what we're dealing with here. ](https://en.wikipedia.org/wiki/Structure_editor)

## Why make another one?

There are a few reasons why I'm not happy with structure editors as they currently exist:

1. They're not fast, fun, and easy to use! They're either entirely mouse-based visual editors, or based on esoteric-feeling keybinds/extensions within a text-based editor. Where is the intuitive structure editor that can do both?
2. They can't parse erroneous code into editable structures, with 1:1 mapping between the code and structure, such that structure => code => structure transformations always yield the same result, _even with syntax errors in the code._
3. They often can't edit conventional programming languages. We generally have structure editors for Lisp, for custom DSLs designed for structure editing, and not much else.

## Will this be a production app?

The idea is to find what is possible in structure editing. To expand the design surface of structure editing and overcome the apparent limitations. Over time, this editor will encompass larger and larger subsets of Lua, becoming more and more useful. It could at least become a web component for inline structure editing of Lua code.

If I end up designing an app that makes editing code more fast, fun, and enjoyable than text editing, then I have a feeling this problem will solve itself. People with more time than me will see this app as a paradigm shifter and create similar editors for other languages and use-cases. All I have to do is make the editor, show it off, and let the marketplace of ideas do the work.

## Where can I learn more?

I'm working on a paper on the design of structure editors, which I will release at some point. No, it's not for school. It's to clarify what's going on here, and maybe shift consciousness around some of these potentials. Thanks for for interest, and please let me know what you think.
