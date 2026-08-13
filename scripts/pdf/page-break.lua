-- Preserve the explicit page-break markers used by the canonical CV Markdown.
--
-- Pandoc retains the HTML comment as a RawBlock when the input format enables
-- raw HTML. Converting only this exact marker keeps ordinary HTML comments out
-- of the generated LaTeX while making pagination intentional and reviewable.

function RawBlock(block)
  if block.format == "html" and block.text:match("<!%-%-%s*PAGE BREAK%s*%-%->") then
    return pandoc.RawBlock("latex", "\\clearpage")
  end

  return block
end
