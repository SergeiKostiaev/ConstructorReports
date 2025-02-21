import styles from "../Home/Home.module.sass";

const DataContainer = ({ title, children }) => {
    return (
        <div className={styles.content}>
            <div className={styles.content__nameDoc}>
                <h3>{title}</h3>
            </div>
            {children && <div>{children}</div>}
        </div>
    );
};

export default DataContainer;