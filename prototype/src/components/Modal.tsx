
type modal = { className?: React.HTMLAttributes<HTMLDivElement>["className"], onBackdropClick: React.HTMLAttributes<HTMLDivElement>["onClick"], visible?: boolean };
export const Modal: React.FC<modal> = ({ children, className, onBackdropClick, visible = true }) => {
    return <>
        <div style={{ display: (visible ? "block" : "none"), visibility: (visible ? "visible" : "hidden"), opacity: (visible ? "0.4" : "0") }} className="modal-backdrop" onClick={onBackdropClick}></div>
        <div style={{ display: (visible ? "flex" : "none"), visibility: (visible ? "visible" : "hidden"), opacity: (visible ? "1" : "0") }} className={"modal " + className}>
            {children}
        </div>
    </>
}